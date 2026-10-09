import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.future_project import FutureProject
    from app.models.ai_log import AILog


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    full_name: Optional[str] = Field(default=None)
    github_username: Optional[str] = Field(default=None, index=True)
    encrypted_github_token: Optional[str] = Field(default=None)
    
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    projects: List["Project"] = Relationship(back_populates="user", cascade_delete=True)
    future_projects: List["FutureProject"] = Relationship(back_populates="user", cascade_delete=True)
    ai_logs: List["AILog"] = Relationship(back_populates="user", cascade_delete=True)
