import uuid
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    encrypt_token,
)
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    GitHubOAuthCallbackRequest,
    GitHubTokenLoginRequest,
    DemoLoginRequest,
    GitHubUrlResponse,
    UserResponse,
    AuthResponse,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _to_user_response(user: User) -> UserResponse:
    avatar = user.avatar_url
    if not avatar and user.github_username:
        avatar = f"https://github.com/{user.github_username}.png"
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        github_username=user.github_username,
        avatar_url=avatar,
        has_github_token=bool(user.encrypted_github_token),
        is_active=user.is_active,
        created_at=user.created_at,
    )


def _generate_token_response(user_id: uuid.UUID) -> TokenResponse:
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, session: Session = Depends(get_session)):
    """Register a new user account with email and password."""
    # Check if email is already taken
    stmt = select(User).where(User.email == request.email.lower().strip())
    existing = session.exec(stmt).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        email=request.email.lower().strip(),
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        github_username=request.github_username,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_user(user)
    except Exception:
        pass

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))


@router.post("/login", response_model=AuthResponse)
def login(request: UserLoginRequest, session: Session = Depends(get_session)):
    """Authenticate with email and password."""
    stmt = select(User).where(User.email == request.email.lower().strip())
    user = session.exec(stmt).first()

    if not user:
        # Check MongoDB Atlas if user exists (handles container restarts/redeploys)
        from app.services.mongodb_sync import MongoDBSyncService
        mongo_user = MongoDBSyncService.get_user_by_email(request.email)
        if mongo_user and mongo_user.get("password_hash"):
            try:
                u_id = uuid.UUID(str(mongo_user.get("id") or mongo_user.get("_id")))
            except Exception:
                u_id = uuid.uuid4()
            user = User(
                id=u_id,
                email=mongo_user.get("email"),
                password_hash=mongo_user.get("password_hash"),
                full_name=mongo_user.get("full_name"),
                github_username=mongo_user.get("github_username"),
                avatar_url=mongo_user.get("avatar_url"),
                encrypted_github_token=mongo_user.get("encrypted_github_token"),
                is_active=mongo_user.get("is_active", True),
                is_superuser=mongo_user.get("is_superuser", False),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            MongoDBSyncService.restore_user_data_if_empty(user.id, session)

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return profile of currently authenticated user."""
    return _to_user_response(current_user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, session: Session = Depends(get_session)):
    """Issue a fresh access token using a valid refresh token."""
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id_str = payload.get("sub")
    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject.",
        )

    stmt = select(User).where(User.id == user_id)
    user = session.exec(stmt).first()
    if not user:
        # Check MongoDB Atlas fallback
        from app.services.mongodb_sync import MongoDBSyncService
        mongo_user = MongoDBSyncService.get_user_by_id(user_id)
        if mongo_user:
            try:
                user = User(
                    id=user_id,
                    email=mongo_user.get("email"),
                    password_hash=mongo_user.get("password_hash") or "managed_by_oauth",
                    full_name=mongo_user.get("full_name"),
                    github_username=mongo_user.get("github_username"),
                    avatar_url=mongo_user.get("avatar_url"),
                    encrypted_github_token=mongo_user.get("encrypted_github_token"),
                    is_active=mongo_user.get("is_active", True),
                    is_superuser=mongo_user.get("is_superuser", False),
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                MongoDBSyncService.restore_user_data_if_empty(user_id, session)
            except Exception:
                pass

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active.",
        )

    return _generate_token_response(user.id)


@router.get("/github/url", response_model=GitHubUrlResponse)
def get_github_oauth_url():
    """Generate GitHub OAuth 2.0 authorization URL or report status if unconfigured."""
    if not settings.GITHUB_CLIENT_ID:
        return GitHubUrlResponse(
            configured=False,
            oauth_url=None,
            client_id=None
        )
    scope = "read:user,repo"
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope={scope}"
    )
    return GitHubUrlResponse(
        configured=True,
        oauth_url=url,
        client_id=settings.GITHUB_CLIENT_ID
    )


@router.post("/github/callback", response_model=AuthResponse)
async def github_oauth_callback(
    request: GitHubOAuthCallbackRequest,
    session: Session = Depends(get_session)
):
    """Exchange GitHub OAuth authorization code for tokens and login/register."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth credentials missing on backend.",
        )

    # 1. Exchange code for access_token with GitHub
    token_url = "https://github.com/login/oauth/access_token"
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_resp = await client.post(
            token_url,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": request.code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with GitHub.",
            )
        token_data = token_resp.json()
        github_token = token_data.get("access_token")
        if not github_token:
            error_desc = token_data.get("error_description", "Invalid GitHub authorization code.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_desc)

        # 2. Fetch GitHub User Profile
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "DevCommand-App",
            },
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to fetch GitHub profile.",
            )
        gh_user = user_resp.json()

        # 3. Fetch GitHub primary email if not public
        email = gh_user.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "DevCommand-App",
                },
            )
            if emails_resp.status_code == 200:
                for em in emails_resp.json():
                    if em.get("primary"):
                        email = em.get("email")
                        break

    login_name = gh_user.get("login")
    if not email:
        email = f"{login_name}@users.noreply.github.com"

    avatar = gh_user.get("avatar_url")
    encrypted_gh = encrypt_token(github_token)

    # 4. Find or Create User (match by email OR github_username)
    stmt = select(User).where(
        (User.email == email.lower().strip()) | (User.github_username == login_name)
    )
    user = session.exec(stmt).first()

    if not user:
        # Check MongoDB Atlas for existing account before generating new UUID
        from app.services.mongodb_sync import MongoDBSyncService
        mongo_user = MongoDBSyncService.get_user_by_email(email)
        if not mongo_user and login_name:
            from app.core.mongodb import get_mongodb_database
            mdb = get_mongodb_database()
            if mdb is not None:
                mongo_user = mdb.users.find_one({"github_username": login_name})

        if mongo_user:
            try:
                user_id = uuid.UUID(str(mongo_user.get("id") or mongo_user.get("_id")))
            except Exception:
                user_id = uuid.uuid4()
            user = User(
                id=user_id,
                email=email.lower().strip(),
                password_hash=mongo_user.get("password_hash") or hash_password(uuid.uuid4().hex),
                full_name=gh_user.get("name") or mongo_user.get("full_name") or login_name,
                github_username=login_name,
                avatar_url=avatar or mongo_user.get("avatar_url"),
                encrypted_github_token=encrypted_gh,
                is_active=mongo_user.get("is_active", True),
                is_superuser=mongo_user.get("is_superuser", False),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            MongoDBSyncService.restore_user_data_if_empty(user.id, session)
        else:
            user = User(
                email=email.lower().strip(),
                password_hash=hash_password(uuid.uuid4().hex),
                full_name=gh_user.get("name") or login_name,
                github_username=login_name,
                avatar_url=avatar,
                encrypted_github_token=encrypted_gh,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
    else:
        user.github_username = login_name
        if avatar:
            user.avatar_url = avatar
        user.encrypted_github_token = encrypted_gh
        user.updated_at = datetime.now(timezone.utc)
        session.add(user)
        session.commit()
        session.refresh(user)

    # Sync to MongoDB Atlas if configured
    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_user(user)
    except Exception:
        pass

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))


@router.post("/github/token-login", response_model=AuthResponse)
async def github_token_login(
    request: GitHubTokenLoginRequest,
    session: Session = Depends(get_session)
):
    """Authenticate or register user using a GitHub Personal Access Token."""
    token = request.token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub Personal Access Token is required."
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "DevCommand-App",
            },
        )
        if user_resp.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired GitHub Personal Access Token. Verify scopes (read:user, repo) on github.com."
            )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub API error: {user_resp.status_code} - {user_resp.text}"
            )
        gh_user = user_resp.json()

        email = gh_user.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "DevCommand-App",
                },
            )
            if emails_resp.status_code == 200:
                for em in emails_resp.json():
                    if em.get("primary"):
                        email = em.get("email")
                        break

    login_name = gh_user.get("login")
    if not email:
        email = f"{login_name}@users.noreply.github.com"

    avatar = gh_user.get("avatar_url")
    encrypted_gh = encrypt_token(token)

    stmt = select(User).where(
        (User.email == email.lower().strip()) | (User.github_username == login_name)
    )
    user = session.exec(stmt).first()

    if not user:
        # Check MongoDB Atlas for existing account before generating new UUID
        from app.services.mongodb_sync import MongoDBSyncService
        mongo_user = MongoDBSyncService.get_user_by_email(email)
        if not mongo_user and login_name:
            from app.core.mongodb import get_mongodb_database
            mdb = get_mongodb_database()
            if mdb is not None:
                mongo_user = mdb.users.find_one({"github_username": login_name})

        if mongo_user:
            try:
                user_id = uuid.UUID(str(mongo_user.get("id") or mongo_user.get("_id")))
            except Exception:
                user_id = uuid.uuid4()
            user = User(
                id=user_id,
                email=email.lower().strip(),
                password_hash=mongo_user.get("password_hash") or hash_password(uuid.uuid4().hex),
                full_name=gh_user.get("name") or mongo_user.get("full_name") or login_name,
                github_username=login_name,
                avatar_url=avatar or mongo_user.get("avatar_url"),
                encrypted_github_token=encrypted_gh,
                is_active=mongo_user.get("is_active", True),
                is_superuser=mongo_user.get("is_superuser", False),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            MongoDBSyncService.restore_user_data_if_empty(user.id, session)
        else:
            user = User(
                email=email.lower().strip(),
                password_hash=hash_password(uuid.uuid4().hex),
                full_name=gh_user.get("name") or login_name,
                github_username=login_name,
                avatar_url=avatar,
                encrypted_github_token=encrypted_gh,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
    else:
        user.github_username = login_name
        if avatar:
            user.avatar_url = avatar
        user.encrypted_github_token = encrypted_gh
        user.updated_at = datetime.now(timezone.utc)
        session.add(user)
        session.commit()
        session.refresh(user)

    # Sync to MongoDB Atlas
    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_user(user)
    except Exception:
        pass

    # Optional initial auto-sync of repos
    if request.sync_repos:
        try:
            from app.services.github_service import GitHubService
            await GitHubService.sync_repositories(user, session)
        except Exception:
            pass

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))


@router.post("/demo-switch", response_model=AuthResponse)
def demo_switch(
    request: DemoLoginRequest,
    session: Session = Depends(get_session)
):
    """Switch or create a distinct test user (e.g. 'alice' or 'bob') for instant verification of user isolation."""
    account_key = request.account.lower().strip()
    if account_key not in ("alice", "bob", "demo"):
        account_key = "alice"

    demo_configs = {
        "alice": {
            "email": "alice.dev@devcommand.ai",
            "name": "Alice Smith",
            "github": "alice-devcommand",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=alice",
        },
        "bob": {
            "email": "bob.lead@devcommand.ai",
            "name": "Bob Chen",
            "github": "bob-devcommand",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=bob",
        },
        "demo": {
            "email": "dev@devcommand.ai",
            "name": "DevCommand Engineer",
            "github": "devcommand-bot",
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=devcommand",
        }
    }

    cfg = demo_configs[account_key]
    stmt = select(User).where(User.email == cfg["email"])
    user = session.exec(stmt).first()

    if not user:
        user = User(
            email=cfg["email"],
            password_hash=hash_password("DevPassword123!"),
            full_name=cfg["name"],
            github_username=cfg["github"],
            avatar_url=cfg["avatar"],
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Seed 1 initial isolated project and 1 idea so each user immediately has unique isolated data!
        from app.models.project import Project
        from app.models.feature import Feature
        from app.models.future_project import FutureProject
        from app.models.enums import ProjectType, ProjectStatus, FeaturePriority, FeatureStatus, FutureProjectPriority

        sample_proj = Project(
            user_id=user.id,
            name=f"{cfg['name'].split()[0]}'s { 'NextGen Analytics' if account_key == 'alice' else 'Core Infrastructure' }",
            description=f"Isolated project owned exclusively by {cfg['name']} ({user.email}).",
            project_type=ProjectType.RESUME if account_key == 'alice' else ProjectType.PRODUCTION,
            status=ProjectStatus.IN_PROGRESS,
            primary_language="TypeScript" if account_key == 'alice' else "Python",
            stars_count=42 if account_key == 'alice' else 128,
            needs_review=False
        )
        session.add(sample_proj)
        session.commit()
        session.refresh(sample_proj)

        feat1 = Feature(
            project_id=sample_proj.id,
            title=f"Architecture Setup ({cfg['name'].split()[0]})",
            priority=FeaturePriority.P0,
            status=FeatureStatus.DONE,
            order_index=0
        )
        feat2 = Feature(
            project_id=sample_proj.id,
            title=f"Telemetry Dashboard ({cfg['name'].split()[0]})",
            priority=FeaturePriority.P1,
            status=FeatureStatus.IN_PROGRESS,
            order_index=1
        )
        session.add(feat1)
        session.add(feat2)

        sample_idea = FutureProject(
            user_id=user.id,
            title=f"{cfg['name'].split()[0]}'s Incubator Idea",
            elevator_pitch=f"Private incubator idea owned by {cfg['name']}.",
            project_type=ProjectType.COLLEGE if account_key == 'alice' else ProjectType.PRODUCTION,
            priority=FutureProjectPriority.P0,
        )
        session.add(sample_idea)
        session.commit()

    # Sync to MongoDB Atlas
    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_user(user)
    except Exception:
        pass

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))

