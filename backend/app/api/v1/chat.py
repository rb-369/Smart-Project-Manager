from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_db
from app.core.qdrant import check_qdrant_connection
from app.models.user import User
from app.models.project import Project
from app.models.feature import Feature
from app.models.future_project import FutureProject
from app.api.v1.auth import get_current_user
from app.services.copilot_service import CopilotService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["Copilot & RAG"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User prompt or question")
    mode: str = Field(default="planner", description="'planner' | 'researcher' | 'judge'")
    project_id: Optional[UUID] = Field(default=None, description="Optional project context scope")
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Chat history")


class ChatCitation(BaseModel):
    title: str
    entity_type: str
    project_name: Optional[str] = None
    score: float


class JudgeVerdict(BaseModel):
    score: int
    verdict_signal: str  # 'BUILD_NOW' | 'PROCEED_WITH_CAUTION' | 'DO_NOT_BUILD'
    verdict_title: str
    brutal_critique: str
    failure_modes: List[str] = []
    what_to_build_instead: str
    summary_verdict: str


class SuggestedFeaturePayload(BaseModel):
    title: str
    priority: str = "P1"
    description: str


class ChatResponse(BaseModel):
    mode: str
    response: str
    raw_content: str
    citations: List[ChatCitation] = []
    judge_data: Optional[JudgeVerdict] = None
    suggested_features: List[SuggestedFeaturePayload] = []
    tier_used: str


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a query to DevCommand AI Copilot in planner, researcher, or judge mode.
    Retrieves grounded context from Qdrant Cloud RAG with user isolation.
    """
    if payload.project_id:
        # Validate that the project belongs to current_user
        project = db.exec(
            select(Project).where(
                Project.id == payload.project_id,
                Project.user_id == current_user.id
            )
        ).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected project not found or does not belong to you."
            )

    result = await CopilotService.process_chat(
        message=payload.message,
        mode=payload.mode,
        user_id=current_user.id,
        project_id=payload.project_id,
        chat_history=payload.history,
    )

    return result


@router.get("/qdrant-status")
def get_qdrant_status(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the real-time cluster connection state and latency of Qdrant Cloud.
    """
    return check_qdrant_connection()


@router.post("/sync-knowledge")
def sync_knowledge_base(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Vectors and indexes all projects, features, and incubator ideas for current_user
    into Qdrant Cloud for instant RAG grounding.
    """
    projects = db.exec(select(Project).where(Project.user_id == current_user.id)).all()
    project_map = {p.id: p.name for p in projects}

    synced_projects = 0
    synced_features = 0
    synced_ideas = 0

    for p in projects:
        if RAGService.index_project(p, current_user.id):
            synced_projects += 1

        features = db.exec(select(Feature).where(Feature.project_id == p.id)).all()
        for f in features:
            if RAGService.index_feature(f, p.name, current_user.id):
                synced_features += 1

    ideas = db.exec(select(FutureProject).where(FutureProject.user_id == current_user.id)).all()
    for idea in ideas:
        if RAGService.index_future_project(idea, current_user.id):
            synced_ideas += 1

    total = synced_projects + synced_features + synced_ideas

    return {
        "status": "success",
        "synced_projects": synced_projects,
        "synced_features": synced_features,
        "synced_ideas": synced_ideas,
        "total_points_indexed": total,
        "message": f"Successfully vectorized and indexed {total} items into Qdrant Cloud.",
    }
