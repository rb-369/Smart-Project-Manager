import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import RecommendationType

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project


class AILog(SQLModel, table=True):
    __tablename__ = "ai_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="projects.id", index=True)
    
    recommendation_type: RecommendationType = Field(index=True)
    provider_used: str = Field(index=True)  # openrouter, gemini, nvidia
    model_used: Optional[str] = Field(default=None)
    
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    latency_ms: int = Field(default=0)
    
    response_payload: Optional[str] = Field(default=None)  # Stored JSON string
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Optional["User"] = Relationship(back_populates="ai_logs")
    project: Optional["Project"] = Relationship(back_populates="ai_logs")
