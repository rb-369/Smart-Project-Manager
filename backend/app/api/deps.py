import uuid
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import decode_token
from app.models.user import User

security_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: Session = Depends(get_session)
) -> User:
    """Dependency that extracts, verifies, and returns the authenticated user."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token must be an access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_id)
    user = session.exec(stmt).first()
    
    if not user:
        # Check MongoDB Atlas if user exists (handles container restarts/redeploys)
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
                # Restore associated project data
                MongoDBSyncService.restore_user_data_if_empty(user_id, session)
            except Exception:
                pass

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
        
    return user
