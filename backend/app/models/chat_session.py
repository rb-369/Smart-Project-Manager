import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import JSON

if TYPE_CHECKING:
    from app.models.user import User


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="projects.id", nullable=True)

    title: str = Field(default="New Chat", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Optional["User"] = Relationship(back_populates="chat_sessions")
    messages: List["ChatMessageRecord"] = Relationship(
        back_populates="session",
        cascade_delete=True,
        sa_relationship_kwargs={"lazy": "selectin"}
    )


class ChatMessageRecord(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    session_id: uuid.UUID = Field(foreign_key="chat_sessions.id", index=True, nullable=False)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)

    role: str = Field(nullable=False)  # "user" | "assistant"
    content: str = Field(nullable=False)
    mode: Optional[str] = Field(default=None)
    tier_used: Optional[str] = Field(default=None)

    subagent_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON, nullable=True))
    citations: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON, nullable=True))

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    session: Optional["ChatSession"] = Relationship(back_populates="messages")

