import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.user import User
from app.models.future_project import FutureProject
from app.models.project import Project
from app.models.enums import FutureProjectPriority, FutureProjectStatus, ProjectStatus
from app.schemas.future_project import (
    CreateFutureProjectRequest,
    UpdateFutureProjectRequest,
    PromoteFutureProjectRequest,
    FutureProjectResponse,
    ParseConceptRequest,
    ParsedConceptResponse,
)
from app.schemas.project import ProjectSummaryResponse
from app.api.v1.projects import _to_project_summary
from app.api.deps import get_current_user
from app.services.ai_service import AIService

router = APIRouter(prefix="/future-projects", tags=["Future Projects Incubator"])


@router.post("/parse-concept", response_model=ParsedConceptResponse)
async def parse_concept_text(
    request: ParseConceptRequest,
    current_user: User = Depends(get_current_user),
):
    """Smartly parse informal WhatsApp messages or raw notes into a structured future project concept."""
    if not request.raw_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Raw text cannot be empty")

    data, provider = await AIService.parse_raw_concept(request.raw_text)

    # Format starter features into notes if notes doesn't already have them
    starter_features = data.get("starter_features", [])
    notes = data.get("notes") or ""
    if starter_features and "starter" not in notes.lower() and "checklist" not in notes.lower():
        features_md = "\n".join([f"- [ ] {f}" for f in starter_features])
        notes = f"{notes}\n\n### Starter MVP Features Checklist:\n{features_md}".strip()

    # Determine ProjectType enum safely
    p_type = data.get("project_type", "RESUME")
    if p_type not in ["RESUME", "COLLEGE", "PRODUCTION"]:
        p_type = "RESUME"

    # Determine Priority enum safely
    prio = data.get("priority", "P1")
    if prio not in ["P0", "P1", "P2"]:
        prio = "P1"

    return ParsedConceptResponse(
        title=str(data.get("title", "New Project Idea")).strip(),
        elevator_pitch=str(data.get("elevator_pitch", "")).strip(),
        target_tech_stack=str(data.get("target_tech_stack", "")).strip(),
        project_type=p_type,
        priority=prio,
        notes=notes,
        starter_features=starter_features,
        provider_used=provider,
    )



@router.get("", response_model=List[FutureProjectResponse])
def list_future_projects(
    status_filter: Optional[FutureProjectStatus] = Query(None, alias="status"),
    priority_filter: Optional[FutureProjectPriority] = Query(None, alias="priority"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List future project ideas sorted by priority (P0 -> P1 -> P2)."""
    query = select(FutureProject).where(FutureProject.user_id == current_user.id)

    if status_filter:
        query = query.where(FutureProject.status == status_filter)
    if priority_filter:
        query = query.where(FutureProject.priority == priority_filter)

    query = query.order_by(FutureProject.priority.asc(), FutureProject.created_at.desc())
    ideas = session.exec(query).all()
    return ideas


@router.post("", response_model=FutureProjectResponse, status_code=status.HTTP_201_CREATED)
def create_future_project(
    request: CreateFutureProjectRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Add a new idea to the future project priority backlog."""
    idea = FutureProject(
        user_id=current_user.id,
        title=request.title.strip(),
        elevator_pitch=request.elevator_pitch,
        target_tech_stack=request.target_tech_stack,
        project_type=request.project_type,
        priority=request.priority,
        notes=request.notes,
        status=FutureProjectStatus.IDEA,
    )
    session.add(idea)
    session.commit()
    session.refresh(idea)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_future_project(idea)
    except Exception:
        pass

    return idea


@router.patch("/{idea_id}", response_model=FutureProjectResponse)
def update_future_project(
    idea_id: uuid.UUID,
    request: UpdateFutureProjectRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update details, priority, or status of an incubator idea."""
    stmt = select(FutureProject).where(FutureProject.id == idea_id, FutureProject.user_id == current_user.id)
    idea = session.exec(stmt).first()
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Future project idea not found")

    if request.title is not None:
        idea.title = request.title.strip()
    if request.elevator_pitch is not None:
        idea.elevator_pitch = request.elevator_pitch
    if request.target_tech_stack is not None:
        idea.target_tech_stack = request.target_tech_stack
    if request.project_type is not None:
        idea.project_type = request.project_type
    if request.priority is not None:
        idea.priority = request.priority
    if request.status is not None:
        idea.status = request.status
    if request.notes is not None:
        idea.notes = request.notes

    idea.updated_at = datetime.now(timezone.utc)
    session.add(idea)
    session.commit()
    session.refresh(idea)

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_future_project(idea)
    except Exception:
        pass

    return idea


@router.post("/{idea_id}/promote", response_model=ProjectSummaryResponse)
def promote_future_project(
    idea_id: uuid.UUID,
    request: PromoteFutureProjectRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Promote a future project idea into an Active Project in the dashboard."""
    stmt = select(FutureProject).where(FutureProject.id == idea_id, FutureProject.user_id == current_user.id)
    idea = session.exec(stmt).first()
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Future project idea not found")

    # Create active Project from this idea
    new_project = Project(
        user_id=current_user.id,
        name=idea.title,
        description=idea.elevator_pitch,
        project_type=idea.project_type,
        status=ProjectStatus.IN_PROGRESS,
        goal=request.initial_goal or idea.elevator_pitch,
        primary_language=idea.target_tech_stack,
        github_repo_id=request.github_repo_id,
        needs_review=False,
    )
    session.add(new_project)
    session.commit()
    session.refresh(new_project)

    # Mark idea as PROMOTED and link the promoted project ID
    idea.status = FutureProjectStatus.PROMOTED
    idea.promoted_project_id = new_project.id
    idea.updated_at = datetime.now(timezone.utc)
    session.add(idea)
    session.commit()

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.sync_project(new_project)
        MongoDBSyncService.sync_future_project(idea)
    except Exception:
        pass

    return _to_project_summary(new_project, [])


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_future_project(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete or discard an idea."""
    stmt = select(FutureProject).where(FutureProject.id == idea_id, FutureProject.user_id == current_user.id)
    idea = session.exec(stmt).first()
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Future project idea not found")

    session.delete(idea)
    session.commit()

    try:
        from app.services.mongodb_sync import MongoDBSyncService
        MongoDBSyncService.delete_future_project(idea_id)
    except Exception:
        pass
