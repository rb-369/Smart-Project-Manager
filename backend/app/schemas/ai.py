from typing import List, Optional
from pydantic import BaseModel
from app.models.enums import ProjectType, FeaturePriority, FutureProjectPriority


class FeatureTriageItem(BaseModel):
    title: str
    description: Optional[str] = None
    priority: FeaturePriority = FeaturePriority.P1


class TriageRepoResponse(BaseModel):
    project_id: str
    suggested_project_type: ProjectType
    suggested_goal: str
    suggested_initial_features: List[FeatureTriageItem]
    provider_used: str


class SuggestedFeatureItem(BaseModel):
    title: str
    description: str
    priority: FeaturePriority = FeaturePriority.P1
    rationale: str


class SuggestFeaturesResponse(BaseModel):
    project_id: str
    project_name: str
    features: List[SuggestedFeatureItem]
    provider_used: str


class SuggestedProjectItem(BaseModel):
    title: str
    elevator_pitch: str
    target_tech_stack: str
    project_type: ProjectType = ProjectType.RESUME
    priority: FutureProjectPriority = FutureProjectPriority.P1
    why_this_project: str


class SuggestProjectsResponse(BaseModel):
    projects: List[SuggestedProjectItem]
    provider_used: str
