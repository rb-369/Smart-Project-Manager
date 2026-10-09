import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.user import User
from app.models.project import Project
from app.models.feature import Feature
from app.models.enums import FeatureStatus
from app.schemas.feature import (
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureResponse,
    BatchReorderRequest,
)
from app.api.deps import get_current_user

router = APIRouter(tags=["Features"])


@router.get("/projects/{project_id}/features", response_model=List[FeatureResponse])
def list_features(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all features for a project."""
    # Verify project belongs to user
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    feat_stmt = (
        select(Feature)
        .where(Feature.project_id == project.id)
        .order_by(Feature.order_index.asc(), Feature.created_at.asc())
    )
    features = session.exec(feat_stmt).all()
    return features


@router.post("/projects/{project_id}/features", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_feature(
    project_id: uuid.UUID,
    request: CreateFeatureRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Add a new feature to the project's backlog."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    feature = Feature(
        project_id=project.id,
        title=request.title.strip(),
        description=request.description,
        priority=request.priority,
        status=request.status,
        order_index=request.order_index,
        completed_at=datetime.now(timezone.utc) if request.status == FeatureStatus.DONE else None,
    )
    session.add(feature)
    session.commit()
    session.refresh(feature)
    return feature


@router.patch("/features/{feature_id}", response_model=FeatureResponse)
def update_feature(
    feature_id: uuid.UUID,
    request: UpdateFeatureRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update feature title, priority, or transition status (Backlog -> In Progress -> Done)."""
    # Join with project to verify user ownership
    stmt = select(Feature, Project).join(Project).where(
        Feature.id == feature_id,
        Project.user_id == current_user.id
    )
    result = session.exec(stmt).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found")

    feature, project = result

    if request.title is not None:
        feature.title = request.title.strip()
    if request.description is not None:
        feature.description = request.description
    if request.priority is not None:
        feature.priority = request.priority
    if request.order_index is not None:
        feature.order_index = request.order_index
    if request.status is not None:
        if request.status == FeatureStatus.DONE and feature.status != FeatureStatus.DONE:
            feature.completed_at = datetime.now(timezone.utc)
        elif request.status != FeatureStatus.DONE:
            feature.completed_at = None
        feature.status = request.status

    feature.updated_at = datetime.now(timezone.utc)
    session.add(feature)
    session.commit()
    session.refresh(feature)
    return feature


@router.delete("/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature(
    feature_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a feature."""
    stmt = select(Feature, Project).join(Project).where(
        Feature.id == feature_id,
        Project.user_id == current_user.id
    )
    result = session.exec(stmt).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found")

    feature, _ = result
    session.delete(feature)
    session.commit()


@router.post("/projects/{project_id}/features/reorder", response_model=List[FeatureResponse])
def batch_reorder_features(
    project_id: uuid.UUID,
    request: BatchReorderRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Batch update ordering index of features."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    order_map = {item.id: item.order_index for item in request.items}
    features = session.exec(select(Feature).where(Feature.project_id == project.id)).all()

    for f in features:
        if f.id in order_map:
            f.order_index = order_map[f.id]
            session.add(f)

    session.commit()
    return session.exec(
        select(Feature).where(Feature.project_id == project.id).order_by(Feature.order_index.asc())
    ).all()
