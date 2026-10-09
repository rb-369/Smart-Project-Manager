import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ProjectType, FutureProjectPriority, FutureProjectStatus

if TYPE_CHECKING:
    from app.models.user import User


class FutureProject(SQLModel, table=True):
    __tablename__ = "future_projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    
    title: str = Field(nullable=False)
    elevator_pitch: Optional[str] = Field(default=None)
    target_tech_stack: Optional[str] = Field(default=None)
    project_type: ProjectType = Field(default=ProjectType.RESUME, index=True)
    priority: FutureProjectPriority = Field(default=FutureProjectPriority.P1, index=True)
    status: FutureProjectStatus = Field(default=FutureProjectStatus.IDEA, index=True)
    notes: Optional[str] = Field(default=None)
    
    promoted_project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="projects.id")

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Optional["User"] = Relationship(back_populates="future_projects")
