import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ProjectType, ProjectStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.feature import Feature
    from app.models.ai_log import AILog


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    
    # GitHub metadata
    github_repo_id: Optional[int] = Field(default=None, index=True)
    name: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None)
    html_url: Optional[str] = Field(default=None)
    primary_language: Optional[str] = Field(default=None, index=True)
    stars_count: int = Field(default=0)
    forks_count: int = Field(default=0)
    default_branch: str = Field(default="main")
    readme_content: Optional[str] = Field(default=None)
    
    # DevCommand tracking & classifications
    project_type: ProjectType = Field(default=ProjectType.RESUME, index=True)
    status: ProjectStatus = Field(default=ProjectStatus.IN_PROGRESS, index=True)
    goal: Optional[str] = Field(default=None)
    needs_review: bool = Field(default=False, index=True)
    
    # Progress Calculation
    manual_progress_override: Optional[int] = Field(default=None)
    use_manual_progress: bool = Field(default=False)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Optional["User"] = Relationship(back_populates="projects")
    features: List["Feature"] = Relationship(back_populates="project", cascade_delete=True)
    ai_logs: List["AILog"] = Relationship(back_populates="project", cascade_delete=True)
