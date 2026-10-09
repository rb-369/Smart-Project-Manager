import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.user import User
from app.models.project import Project
from app.models.feature import Feature
from app.models.ai_log import AILog
from app.models.enums import RecommendationType, ProjectType, FeaturePriority, FutureProjectPriority
from app.schemas.ai import (
    TriageRepoResponse,
    FeatureTriageItem,
    SuggestFeaturesResponse,
    SuggestedFeatureItem,
    SuggestProjectsResponse,
    SuggestedProjectItem,
)
from app.services.ai_service import AIService
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Recommendations"])


@router.post("/triage/{project_id}", response_model=TriageRepoResponse)
async def triage_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Analyze repository and generate recommended classification, goal, and starter features."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    result, provider = await AIService.triage_repository(
        repo_name=project.name,
        description=project.description,
        language=project.primary_language,
        readme=project.readme_content,
    )

    # Log AI invocation
    ai_log = AILog(
        user_id=current_user.id,
        project_id=project.id,
        recommendation_type=RecommendationType.TRIAGE,
        provider_used=provider,
        response_payload=json.dumps(result),
    )
    session.add(ai_log)
    session.commit()

    features_list = [
        FeatureTriageItem(
            title=f["title"],
            description=f.get("description"),
            priority=FeaturePriority(f.get("priority", "P1")),
        )
        for f in result.get("suggested_initial_features", [])
    ]

    p_type = result.get("suggested_project_type", "RESUME")
    if p_type not in ProjectType.__members__:
        p_type = "RESUME"

    return TriageRepoResponse(
        project_id=str(project.id),
        suggested_project_type=ProjectType(p_type),
        suggested_goal=result.get("suggested_goal", f"Build and showcase {project.name}"),
        suggested_initial_features=features_list,
        provider_used=provider,
    )


@router.post("/suggest-features/{project_id}", response_model=SuggestFeaturesResponse)
async def suggest_project_features(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Suggest 3 to 5 high-impact next features aligned with project's goal."""
    stmt = select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    project = session.exec(stmt).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    feat_stmt = select(Feature).where(Feature.project_id == project.id)
    features = session.exec(feat_stmt).all()
    features_payload = [
        {"title": f.title, "status": f.status.value, "priority": f.priority.value}
        for f in features
    ]

    result, provider = await AIService.suggest_next_features(
        project_name=project.name,
        project_type=project.project_type.value,
        goal=project.goal,
        tech_stack=project.primary_language,
        existing_features=features_payload,
    )

    ai_log = AILog(
        user_id=current_user.id,
        project_id=project.id,
        recommendation_type=RecommendationType.NEXT_FEATURES,
        provider_used=provider,
        response_payload=json.dumps(result),
    )
    session.add(ai_log)
    session.commit()

    suggested_items = []
    for f in result.get("features", []):
        prio = f.get("priority", "P1")
        if prio not in FeaturePriority.__members__:
            prio = "P1"
        suggested_items.append(
            SuggestedFeatureItem(
                title=f["title"],
                description=f.get("description", ""),
                priority=FeaturePriority(prio),
                rationale=f.get("rationale", "Aligned with project goal."),
            )
        )

    return SuggestFeaturesResponse(
        project_id=str(project.id),
        project_name=project.name,
        features=suggested_items,
        provider_used=provider,
    )


@router.post("/suggest-projects", response_model=SuggestProjectsResponse)
async def suggest_next_projects(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Recommend 3 new project concepts based on existing repository portfolio."""
    stmt = select(Project).where(Project.user_id == current_user.id)
    projects = session.exec(stmt).all()
    projects_payload = [
        {"name": p.name, "primary_language": p.primary_language, "project_type": p.project_type.value}
        for p in projects
    ]

    result, provider = await AIService.suggest_next_projects(projects_payload)

    ai_log = AILog(
        user_id=current_user.id,
        recommendation_type=RecommendationType.NEXT_PROJECT,
        provider_used=provider,
        response_payload=json.dumps(result),
    )
    session.add(ai_log)
    session.commit()

    suggested_projects = []
    for p in result.get("projects", []):
        p_type = p.get("project_type", "RESUME")
        if p_type not in ProjectType.__members__:
            p_type = "RESUME"
        prio = p.get("priority", "P1")
        if prio not in FutureProjectPriority.__members__:
            prio = "P1"

        suggested_projects.append(
            SuggestedProjectItem(
                title=p["title"],
                elevator_pitch=p.get("elevator_pitch", ""),
                target_tech_stack=p.get("target_tech_stack", "Fullstack"),
                project_type=ProjectType(p_type),
                priority=FutureProjectPriority(prio),
                why_this_project=p.get("why_this_project", "Great addition to your engineering portfolio."),
            )
        )

    return SuggestProjectsResponse(
        projects=suggested_projects,
        provider_used=provider,
    )
