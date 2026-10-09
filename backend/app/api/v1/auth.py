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
    UserResponse,
    AuthResponse,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        github_username=user.github_username,
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

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))


@router.post("/login", response_model=AuthResponse)
def login(request: UserLoginRequest, session: Session = Depends(get_session)):
    """Authenticate with email and password."""
    stmt = select(User).where(User.email == request.email.lower().strip())
    user = session.exec(stmt).first()

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
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active.",
        )

    return _generate_token_response(user.id)


@router.get("/github/url")
def get_github_oauth_url():
    """Generate GitHub OAuth 2.0 authorization URL."""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured on this server.",
        )
    scope = "read:user,repo"
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope={scope}"
    )
    return {"oauth_url": url}


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
    async with httpx.AsyncClient() as client:
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
            error_desc = token_data.get("error_description", "Invalid GitHub code.")
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

    if not email:
        email = f"{gh_user['login']}@users.noreply.github.com"

    # 4. Find or Create User
    stmt = select(User).where(User.email == email.lower().strip())
    user = session.exec(stmt).first()

    encrypted_gh = encrypt_token(github_token)

    if not user:
        user = User(
            email=email.lower().strip(),
            password_hash=hash_password(uuid.uuid4().hex),
            full_name=gh_user.get("name") or gh_user.get("login"),
            github_username=gh_user.get("login"),
            encrypted_github_token=encrypted_gh,
        )
        session.add(user)
    else:
        user.github_username = gh_user.get("login")
        user.encrypted_github_token = encrypted_gh
        user.updated_at = datetime.now(timezone.utc)
        session.add(user)

    session.commit()
    session.refresh(user)

    tokens = _generate_token_response(user.id)
    return AuthResponse(tokens=tokens, user=_to_user_response(user))
