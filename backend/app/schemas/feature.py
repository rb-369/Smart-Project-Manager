import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FeaturePriority, FeatureStatus


class CreateFeatureRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: FeaturePriority = FeaturePriority.P1
    status: FeatureStatus = FeatureStatus.BACKLOG
    order_index: int = 0


class UpdateFeatureRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[FeaturePriority] = None
    status: Optional[FeatureStatus] = None
    order_index: Optional[int] = None


class BatchReorderItem(BaseModel):
    id: uuid.UUID
    order_index: int


class BatchReorderRequest(BaseModel):
    items: List[BatchReorderItem]


class FeatureResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: Optional[str] = None
    priority: FeaturePriority
    status: FeatureStatus
    order_index: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
