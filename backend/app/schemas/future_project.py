import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProjectType, FutureProjectPriority, FutureProjectStatus


class CreateFutureProjectRequest(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    elevator_pitch: Optional[str] = None
    target_tech_stack: Optional[str] = None
    project_type: ProjectType = ProjectType.RESUME
    priority: FutureProjectPriority = FutureProjectPriority.P1
    notes: Optional[str] = None


class UpdateFutureProjectRequest(BaseModel):
    title: Optional[str] = None
    elevator_pitch: Optional[str] = None
    target_tech_stack: Optional[str] = None
    project_type: Optional[ProjectType] = None
    priority: Optional[FutureProjectPriority] = None
    status: Optional[FutureProjectStatus] = None
    notes: Optional[str] = None


class PromoteFutureProjectRequest(BaseModel):
    github_repo_id: Optional[int] = None
    initial_goal: Optional[str] = None


class FutureProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    elevator_pitch: Optional[str] = None
    target_tech_stack: Optional[str] = None
    project_type: ProjectType
    priority: FutureProjectPriority
    status: FutureProjectStatus
    notes: Optional[str] = None
    promoted_project_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
