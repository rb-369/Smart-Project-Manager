import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProjectType, ProjectStatus
from app.schemas.feature import FeatureResponse


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    project_type: ProjectType = ProjectType.RESUME
    status: ProjectStatus = ProjectStatus.IN_PROGRESS
    goal: Optional[str] = None
    primary_language: Optional[str] = None
    html_url: Optional[str] = None


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[ProjectType] = None
    status: Optional[ProjectStatus] = None
    goal: Optional[str] = None
    primary_language: Optional[str] = None
    html_url: Optional[str] = None
    use_manual_progress: Optional[bool] = None
    manual_progress_override: Optional[int] = Field(default=None, ge=0, le=100)


class ConfirmTriageRequest(BaseModel):
    project_type: ProjectType
    goal: str
    initial_features: Optional[List[dict]] = None  # [{title, priority, description}]


class ProjectSummaryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    html_url: Optional[str] = None
    primary_language: Optional[str] = None
    github_repo_id: Optional[int] = None
    project_type: ProjectType
    status: ProjectStatus
    goal: Optional[str] = None
    needs_review: bool
    progress_percentage: int
    total_features: int
    completed_features: int
    stars_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectDetailResponse(ProjectSummaryResponse):
    features: List[FeatureResponse] = []
    use_manual_progress: bool
    manual_progress_override: Optional[int] = None
    readme_content: Optional[str] = None
