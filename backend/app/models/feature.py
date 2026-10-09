import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import FeaturePriority, FeatureStatus

if TYPE_CHECKING:
    from app.models.project import Project


class Feature(SQLModel, table=True):
    __tablename__ = "features"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True, nullable=False)
    
    title: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)
    priority: FeaturePriority = Field(default=FeaturePriority.P1, index=True)
    status: FeatureStatus = Field(default=FeatureStatus.BACKLOG, index=True)
    order_index: int = Field(default=0)
    
    completed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    project: Optional["Project"] = Relationship(back_populates="features")
