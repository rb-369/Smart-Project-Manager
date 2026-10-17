import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: Optional[str] = None
    github_username: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class GitHubOAuthCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None


class GitHubTokenLoginRequest(BaseModel):
    token: str = Field(..., min_length=10, description="GitHub Personal Access Token (classic or fine-grained)")
    sync_repos: bool = Field(default=True, description="Automatically sync repositories on successful login")


class DemoLoginRequest(BaseModel):
    account: str = Field(default="alice", description="Account identifier: 'alice', 'bob', or 'demo'")


class GitHubUrlResponse(BaseModel):
    configured: bool
    oauth_url: Optional[str] = None
    client_id: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    has_github_token: bool = False
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    tokens: TokenResponse
    user: UserResponse

