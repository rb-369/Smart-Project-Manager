import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.models.user import User
from app.models.project import Project
from app.models.feature import Feature
from app.models.enums import ProjectType, ProjectStatus, FeatureStatus, FeaturePriority
from app.schemas.project import (
    CreateProjectRequest,
    UpdateProjectRequest,
    ConfirmTriageRequest,
    BatchReorderRequest,
    ProjectSummaryResponse,
    ProjectDetailResponse,
)
from app.schemas.feature import FeatureResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

PRIORITY_WEIGHTS = {
    FeaturePriority.P0: 4,
    FeaturePriority.P1: 3,
    FeaturePriority.P2: 2,
    FeaturePriority.P3: 1,
}


def calculate_project_progress(project: Project, features: List[Feature]) -> int:
    """Calculate priority-weighted progress percentage or return manual override."""
    if project.use_manual_progress and project.manual_progress_override is not None:
        return min(max(project.manual_progress_override, 0), 100)

    if not features:
        return 0

    total_weight = sum(PRIORITY_WEIGHTS.get(f.priority, 1) for f in features)
    if total_weight == 0:
        return 0

    done_weight = sum(
        PRIORITY_WEIGHTS.get(f.priority, 1)
        for f in features
        if f.status == FeatureStatus.DONE
    )
    return round((done_weight / total_weight) * 100)


def _to_project_summary(project: Project, features: List[Feature]) -> ProjectSummaryResponse:
    done_count = sum(1 for f in features if f.status == FeatureStatus.DONE)
    progress = calculate_project_progress(project, features)
    return ProjectSummaryResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        html_url=project.html_url,
        live_url=project.live_url,
        primary_language=project.primary_language,
        github_repo_id=project.github_repo_id,
        project_type=project.project_type,
        status=project.status,
        goal=project.goal,
        needs_review=project.needs_review,
        is_starred=bool(project.is_starred),
        is_hidden=bool(project.is_hidden),
        order_index=int(project.order_index or 0),
        progress_percentage=progress,
        total_features=len(features),
        completed_features=done_count,
        stars_count=project.stars_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=List[ProjectSummaryResponse])
def list_projects(
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    type_filter: Optional[ProjectType] = Query(None, alias="project_type"),
    needs_review: Optional[bool] = Query(None),
    is_starred: Optional[bool] = Query(None),
    is_hidden: Optional[bool] = Query(None, description="Filter hidden projects (None = all non-hidden)"),
    has_live_url: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all projects belonging to the user with dynamic progress and feature counts."""
    query = select(Project).where(Project.user_id == current_user.id)

    if status_filter:
        query = query.where(Project.status == status_filter)
    if type_filter:
        query = query.where(Project.project_type == type_filter)
    if needs_review is not None:
        query = query.where(Project.needs_review == needs_review)
    if is_starred is not None:
        query = query.where(Project.is_starred == is_starred)
    if is_hidden is not None:
        query = query.where(Project.is_hidden == is_hidden)
    if has_live_url is True:
        query = query.where(Project.live_url.is_not(None))
    if search:
        query = query.where(Project.name.ilike(f"%{search.strip()}%"))

    query = query.order_by(
        Project.is_starred.desc(),
        Project.order_index.asc(),
        Project.updated_at.desc(),
    )
    projects = session.exec(query).all()

    # Pre-fetch features for efficient calculation
    results: List[ProjectSummaryResponse] = []
    for p in projects:
        features = session.exec(
            select(Feature).where(Feature.project_id == p.id)
        ).all()
        results.append(_to_project_summary(p, features))

    return results


@router.patch("/reorder", response_model=List[ProjectSummaryResponse])
def reorder_projects(
    request: BatchReorderRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Batch updates custom order_index for projects (drag-and-drop or manual reordering)."""
    updated_projects = []
    for item in request.items:
        p = session.exec(
            select(Project).where(Project.id == item.id, Project.user_id == current_user.id)
        ).first()
        if p:
            p.order_index = item.order_index
            session.add(p)
            updated_projects.append(p)
    session.commit()

    for p in updated_projects:
        try:
            from app.services.mongodb_sync import MongoDBSyncService
            MongoDBSyncService.sync_project(p)
        except Exception:
            pass

    query = (
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.is_starred.desc(), Project.order_index.asc(), Project.updated_at.desc())
    )
    all_p = session.exec(query).all()
    results: List[ProjectSummaryResponse] = []
    for p in all_p:
        features = session.exec(select(Feature).where(Feature.project_id == p.id)).all()
        results.append(_to_project_summary(p, features))
    return results


@router.post("", response_model=ProjectSummaryResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    request: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new manual project."""
    project = Project(
        user_id=current_user.id,
        name=request.name.strip(),
        description=request.description,
        project_type=request.project_type,
        status=request.status,
        goal=request.goal,
        primary_language=request.primary_language,
        html_url=request.html_url,
        live_url=request.live_url,
        is_starred=request.is_starred,
        is_hidden=request.is_hidden,
        order_index=request.order_index,
        needs_review=False,
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_project(project)
    except Exception:
        pass

    return _to_project_summary(project, [])


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_detail(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Retrieve full project details with complete features list."""
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
    summary = _to_project_summary(project, features)

    return ProjectDetailResponse(
        **summary.model_dump(),
        features=[FeatureResponse.model_validate(f) for f in features],
        use_manual_progress=project.use_manual_progress,
        manual_progress_override=project.manual_progress_override,
        readme_content=project.readme_content,
    )


@router.patch("/{project_id}", response_model=ProjectSummaryResponse)
def update_project(
    project_id: uuid.UUID,
    request: UpdateProjectRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update project metadata, status, goal, or manual progress."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if request.name is not None:
        project.name = request.name.strip()
    if request.description is not None:
        project.description = request.description
    if request.project_type is not None:
        project.project_type = request.project_type
    if request.status is not None:
        project.status = request.status
    if request.goal is not None:
        project.goal = request.goal
    if request.primary_language is not None:
        project.primary_language = request.primary_language
    if request.html_url is not None:
        project.html_url = request.html_url
    if request.live_url is not None:
        project.live_url = request.live_url.strip() if request.live_url.strip() else None
    if request.is_starred is not None:
        project.is_starred = request.is_starred
    if request.is_hidden is not None:
        project.is_hidden = request.is_hidden
    if request.order_index is not None:
        project.order_index = request.order_index
    if request.use_manual_progress is not None:
        project.use_manual_progress = request.use_manual_progress
    if request.manual_progress_override is not None:
        project.manual_progress_override = request.manual_progress_override

    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_project(project)
    except Exception:
        pass

    features = session.exec(select(Feature).where(Feature.project_id == project.id)).all()
    return _to_project_summary(project, features)


@router.patch("/{project_id}/star", response_model=ProjectSummaryResponse)
def toggle_star_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Toggle starred / main status for a project."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.is_starred = not project.is_starred
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_project(project)
    except Exception:
        pass

    features = session.exec(select(Feature).where(Feature.project_id == project.id)).all()
    return _to_project_summary(project, features)


@router.patch("/{project_id}/hide", response_model=ProjectSummaryResponse)
def toggle_hide_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Toggle hidden / soft-deleted status for a project."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.is_hidden = not project.is_hidden
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_project(project)
    except Exception:
        pass

    features = session.exec(select(Feature).where(Feature.project_id == project.id)).all()
    return _to_project_summary(project, features)


@router.post("/{project_id}/confirm-triage", response_model=ProjectSummaryResponse)
def confirm_triage(
    project_id: uuid.UUID,
    request: ConfirmTriageRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Confirm AI-triage suggestions: sets project type & goal, adds initial features, clears needs_review."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.project_type = request.project_type
    project.goal = request.goal
    project.needs_review = False
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)

    # Insert initial features if provided
    created_features: List[Feature] = []
    if request.initial_features:
        for idx, f in enumerate(request.initial_features):
            prio = f.get("priority", "P1")
            if prio not in FeaturePriority.__members__:
                prio = "P1"
            feature = Feature(
                project_id=project.id,
                title=f.get("title", f"Feature {idx + 1}"),
                description=f.get("description"),
                priority=FeaturePriority(prio),
                status=FeatureStatus.BACKLOG,
                order_index=idx,
            )
            session.add(feature)
            created_features.append(feature)

    session.commit()
    session.refresh(project)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_project(project)
        for cf in created_features:
            session.refresh(cf)
            MongoDBSyncService.sync_feature(cf)
    except Exception:
        pass

    features = session.exec(select(Feature).where(Feature.project_id == project.id)).all()
    return _to_project_summary(project, features)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a project and cascade delete all its features."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    session.delete(project)
    session.commit()

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.delete_project(project_id)
    except Exception:
        pass

