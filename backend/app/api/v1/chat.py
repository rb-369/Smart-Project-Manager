import time
import httpx
import re
from datetime import datetime, timezone
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
from app.models.chat_session import ChatSession, ChatMessageRecord
from app.api.v1.auth import get_current_user
from app.services.copilot_service import CopilotService
from app.services.rag_service import RAGService
from app.services.mongodb_sync import MongoDBSyncService

router = APIRouter(prefix="/chat", tags=["Copilot & RAG"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User prompt or question")
    mode: str = Field(default="auto", description="'auto' | 'eval' | 'chat' | 'openui'")
    project_id: Optional[UUID] = Field(default=None, description="Optional project context scope")
    session_id: Optional[UUID] = Field(default=None, description="Optional chat session ID for multi-chat threading")
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Chat history")


class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Chat"
    project_id: Optional[UUID] = None


class UpdateSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)


class ChatCitation(BaseModel):
    title: str
    entity_type: str
    project_name: Optional[str] = None
    score: float


class JudgeVerdict(BaseModel):
    score: int = 50
    verdict_signal: str = "PROCEED_WITH_CAUTION"  # 'BUILD_NOW' | 'PROCEED_WITH_CAUTION' | 'DO_NOT_BUILD'
    verdict_title: str = "The Judge's Verdict"
    brutal_critique: str = ""
    failure_modes: List[str] = []
    what_to_build_instead: str = ""
    summary_verdict: str = ""


class SuggestedFeaturePayload(BaseModel):
    title: str
    priority: str = "P1"
    description: str


class ChatResponse(BaseModel):
    mode: str
    response: str
    raw_content: str
    session_id: Optional[str] = None
    citations: List[ChatCitation] = []
    judge_data: Optional[JudgeVerdict] = None
    suggested_features: List[SuggestedFeaturePayload] = []
    subagent_data: Optional[Dict[str, Any]] = None
    openui_lang: Optional[str] = None
    tier_used: str


@router.get("/sessions")
def list_chat_sessions(
    project_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves all chat sessions for the authenticated user, ordered by most recently updated.
    Guarantees strict multi-tenant isolation: each user only sees their own chat sessions.
    """
    stmt = select(ChatSession).where(ChatSession.user_id == current_user.id)
    if project_id:
        stmt = stmt.where(ChatSession.project_id == project_id)
    stmt = stmt.order_by(ChatSession.updated_at.desc())

    sessions = db.exec(stmt).all()

    result = []
    for s in sessions:
        # Fetch latest message snippet and count
        msgs = db.exec(
            select(ChatMessageRecord)
            .where(ChatMessageRecord.session_id == s.id)
            .order_by(ChatMessageRecord.created_at.desc())
        ).all()
        
        last_msg = msgs[0].content[:90] if msgs else None
        result.append({
            "id": str(s.id),
            "title": s.title,
            "project_id": str(s.project_id) if s.project_id else None,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
            "message_count": len(msgs),
            "last_message": last_msg,
        })

    return {"status": "success", "sessions": result}


@router.post("/sessions")
def create_chat_session(
    payload: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new chat session thread for the current authenticated user.
    """
    if payload.project_id:
        project = db.exec(
            select(Project).where(
                Project.id == payload.project_id,
                Project.user_id == current_user.id
            )
        ).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected project not found or access denied."
            )

    new_session = ChatSession(
        user_id=current_user.id,
        project_id=payload.project_id,
        title=payload.title.strip() if payload.title else "New Chat",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Sync to MongoDB Atlas
    MongoDBSyncService.save_chat_session(
        user_id=current_user.id,
        session_id=new_session.id,
        title=new_session.title,
        project_id=new_session.project_id,
    )

    return {
        "status": "success",
        "session": {
            "id": str(new_session.id),
            "title": new_session.title,
            "project_id": str(new_session.project_id) if new_session.project_id else None,
            "created_at": new_session.created_at.isoformat(),
            "updated_at": new_session.updated_at.isoformat(),
            "message_count": 0,
        }
    }


@router.get("/sessions/{session_id}")
def get_chat_session_detail(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves full chat message history for a specific chat session.
    Strictly enforces user isolation: 404 if the session belongs to another user.
    """
    session = db.exec(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or does not belong to you."
        )

    records = db.exec(
        select(ChatMessageRecord)
        .where(
            ChatMessageRecord.session_id == session_id,
            ChatMessageRecord.user_id == current_user.id
        )
        .order_by(ChatMessageRecord.created_at.asc())
    ).all()

    messages = []
    for r in records:
        messages.append({
            "id": str(r.id),
            "role": r.role,
            "content": r.content,
            "mode": r.mode,
            "tier_used": r.tier_used,
            "subagent_data": r.subagent_data,
            "citations": r.citations or [],
            "openui_lang": r.subagent_data.get("openui_lang") if r.subagent_data else None,
            "created_at": r.created_at.isoformat(),
        })

    return {
        "status": "success",
        "session": {
            "id": str(session.id),
            "title": session.title,
            "project_id": str(session.project_id) if session.project_id else None,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
            "message_count": len(messages),
        },
        "messages": messages,
    }


@router.patch("/sessions/{session_id}")
def update_chat_session(
    session_id: UUID,
    payload: UpdateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Renames a chat session title.
    """
    session = db.exec(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or does not belong to you."
        )

    session.title = payload.title.strip()
    session.updated_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()
    db.refresh(session)

    MongoDBSyncService.save_chat_session(
        user_id=current_user.id,
        session_id=session.id,
        title=session.title,
        project_id=session.project_id,
    )

    return {
        "status": "success",
        "session": {
            "id": str(session.id),
            "title": session.title,
            "updated_at": session.updated_at.isoformat(),
        }
    }


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a specific chat session and all messages within it.
    """
    session = db.exec(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or does not belong to you."
        )

    # Delete all messages belonging to this session
    messages = db.exec(
        select(ChatMessageRecord).where(ChatMessageRecord.session_id == session_id)
    ).all()
    for m in messages:
        db.delete(m)

    db.delete(session)
    db.commit()

    # Delete from MongoDB Atlas
    MongoDBSyncService.delete_chat_session(user_id=current_user.id, session_id=session_id)

    return {"status": "success", "message": "Chat session and conversation history deleted successfully."}


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a query to the unified DevCommand AI Copilot within an isolated chat session.
    Automatically orchestrates Market Researcher, The Judge, and Feature Planner sub-agents
    for feature pitches, or responds conversationally for general queries.
    Grounds context from Qdrant Cloud RAG with user isolation and saves to multi-tenant chat storage.
    """
    if payload.project_id:
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

    # 1. Resolve or create ChatSession for current_user
    chat_session = None
    is_new_session = False
    if payload.session_id:
        chat_session = db.exec(
            select(ChatSession).where(
                ChatSession.id == payload.session_id,
                ChatSession.user_id == current_user.id
            )
        ).first()
        if not chat_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target chat session not found or does not belong to you."
            )
    else:
        # Auto-create session for current_user
        candidate_title = re.sub(r"^/(?:eval|evaluate|plan|research|audit|openui|pivot)\s+", "", payload.message.strip(), flags=re.IGNORECASE)
        if len(candidate_title) > 42:
            candidate_title = candidate_title[:39] + "..."
        chat_session = ChatSession(
            user_id=current_user.id,
            project_id=payload.project_id,
            title=candidate_title if candidate_title else "New Chat",
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)
        is_new_session = True

    # 2. Extract explicitly tagged entities (@projects and #ideas)
    project_mentions = re.findall(r"@([a-zA-Z0-9_\-\.]+)", payload.message)
    idea_mentions = re.findall(r"#([a-zA-Z0-9_\-\.]+)", payload.message)
    tagged_blocks = []

    if project_mentions:
        user_projects = db.exec(
            select(Project).where(Project.user_id == current_user.id)
        ).all()
        for mention in project_mentions:
            clean_m = mention.lower().replace("-", "").replace("_", "")
            match = None
            for p in user_projects:
                p_clean = p.name.lower().replace("-", "").replace("_", "")
                url_clean = (p.html_url or "").lower().replace("-", "").replace("_", "")
                if clean_m in p_clean or p_clean in clean_m or (url_clean and clean_m in url_clean):
                    match = p
                    break
            if match:
                features = db.exec(
                    select(Feature).where(Feature.project_id == match.id)
                ).all()
                feat_lines = [f"- {f.title} ({f.priority}, status: {f.status})" for f in features[:6]]
                feat_str = "\n".join(feat_lines) if feat_lines else "None listed yet."
                tagged_blocks.append(
                    f"TAGGED PROJECT REPOSITORY: @{match.name}\n"
                    f"Repository URL: {match.html_url or 'N/A'}\n"
                    f"Description: {match.description or 'No description'}\n"
                    f"Primary Language: {match.primary_language or 'Unspecified'}\n"
                    f"Goal: {match.goal or 'N/A'}\n"
                    f"Current Roadmap Features:\n{feat_str}"
                )

    if idea_mentions:
        user_ideas = db.exec(
            select(FutureProject).where(FutureProject.user_id == current_user.id)
        ).all()
        for mention in idea_mentions:
            clean_m = mention.lower().replace("-", "").replace("_", "")
            match = None
            for idea in user_ideas:
                idea_clean = (idea.title or "").lower().replace("-", "").replace("_", "")
                if clean_m in idea_clean or idea_clean in clean_m:
                    match = idea
                    break
            if match:
                tagged_blocks.append(
                    f"TAGGED INCUBATOR IDEA: #{match.title}\n"
                    f"Elevator Pitch: {match.elevator_pitch or match.description or 'N/A'}\n"
                    f"Target Tech Stack: {match.target_tech_stack or 'N/A'}\n"
                    f"Notes: {match.notes or 'N/A'}\n"
                    f"Priority: {match.priority or 'P1'}\n"
                    f"Status: {match.status or 'incubating'}"
                )

    tagged_context = "\n\n".join(tagged_blocks) if tagged_blocks else None

    # 3. Process query via Copilot
    result = await CopilotService.process_chat(
        message=payload.message,
        mode=payload.mode,
        user_id=current_user.id,
        project_id=payload.project_id,
        chat_history=payload.history,
        session_id=chat_session.id,
        tagged_context=tagged_context,
    )

    # 3. Save records in SQLModel for ACID durability & rapid retrieval
    user_record = ChatMessageRecord(
        session_id=chat_session.id,
        user_id=current_user.id,
        role="user",
        content=payload.message,
        mode=payload.mode,
    )
    db.add(user_record)

    assistant_record = ChatMessageRecord(
        session_id=chat_session.id,
        user_id=current_user.id,
        role="assistant",
        content=result.get("response", ""),
        mode=result.get("mode"),
        tier_used=result.get("tier_used"),
        subagent_data=result.get("subagent_data"),
        citations=result.get("citations"),
    )
    db.add(assistant_record)

    # Update session's updated_at and title if it was default "New Chat"
    chat_session.updated_at = datetime.now(timezone.utc)
    if chat_session.title in ["New Chat", ""] and not is_new_session:
        clean_title = payload.message.strip().replace("/eval ", "").replace("/evaluate ", "")
        if len(clean_title) > 42:
            clean_title = clean_title[:39] + "..."
        chat_session.title = clean_title
    db.add(chat_session)
    db.commit()

    # Mirror session to MongoDB Atlas
    MongoDBSyncService.save_chat_session(
        user_id=current_user.id,
        session_id=chat_session.id,
        title=chat_session.title,
        project_id=chat_session.project_id,
    )

    result["session_id"] = str(chat_session.id)
    return result


@router.get("/history")
def get_chat_history_endpoint(
    project_id: Optional[UUID] = None,
    session_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves user's persistent chat conversation history and sub-agent cards.
    If session_id is provided, returns that specific thread.
    Otherwise returns latest session history or MongoDB cloud history.
    """
    if session_id:
        records = db.exec(
            select(ChatMessageRecord)
            .where(
                ChatMessageRecord.session_id == session_id,
                ChatMessageRecord.user_id == current_user.id,
            )
            .order_by(ChatMessageRecord.created_at.asc())
        ).all()
        history = [
            {
                "id": str(r.id),
                "role": r.role,
                "content": r.content,
                "mode": r.mode,
                "tier_used": r.tier_used,
                "subagent_data": r.subagent_data,
                "citations": r.citations or [],
                "openui_lang": r.subagent_data.get("openui_lang") if r.subagent_data else None,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ]
        return {"status": "success", "history": history, "session_id": str(session_id)}

    # Check for latest session in SQLModel
    latest_sess = db.exec(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    ).first()

    if latest_sess:
        records = db.exec(
            select(ChatMessageRecord)
            .where(
                ChatMessageRecord.session_id == latest_sess.id,
                ChatMessageRecord.user_id == current_user.id,
            )
            .order_by(ChatMessageRecord.created_at.asc())
        ).all()
        history = [
            {
                "id": str(r.id),
                "role": r.role,
                "content": r.content,
                "mode": r.mode,
                "tier_used": r.tier_used,
                "subagent_data": r.subagent_data,
                "citations": r.citations or [],
                "openui_lang": r.subagent_data.get("openui_lang") if r.subagent_data else None,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ]
        if history:
            return {"status": "success", "history": history, "session_id": str(latest_sess.id)}

    # Fallback to MongoDB
    history = MongoDBSyncService.get_chat_history(
        user_id=current_user.id,
        project_id=project_id,
        session_id=session_id,
        limit=50
    )
    return {"status": "success", "history": history}


@router.delete("/history")
def clear_chat_history_endpoint(
    project_id: Optional[UUID] = None,
    session_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clears user's chat conversation history (scoped to session if provided, or all for user).
    """
    if session_id:
        records = db.exec(
            select(ChatMessageRecord).where(
                ChatMessageRecord.session_id == session_id,
                ChatMessageRecord.user_id == current_user.id,
            )
        ).all()
        for r in records:
            db.delete(r)
        db.commit()
    else:
        records = db.exec(
            select(ChatMessageRecord).where(ChatMessageRecord.user_id == current_user.id)
        ).all()
        for r in records:
            db.delete(r)
        
        sessions = db.exec(
            select(ChatSession).where(ChatSession.user_id == current_user.id)
        ).all()
        for s in sessions:
            db.delete(s)
        db.commit()

    success = MongoDBSyncService.clear_chat_history(
        user_id=current_user.id,
        project_id=project_id,
        session_id=session_id
    )
    return {"status": "success", "cleared": True, "message": "Chat history cleared successfully."}



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


@router.get("/oui1-status")
async def get_oui1_status(current_user: User = Depends(get_current_user)):
    """
    Checks the connectivity and status of the Thesys OUI-1 generative UI model endpoint (vLLM).
    Returns whether OUI-1 is reachable, latency, model identifier, and cascade fallback mode.
    """
    from app.core.config import settings

    if not settings.OPENUI_ENABLED:
        return {
            "configured": False,
            "connected": False,
            "model": settings.OUI1_MODEL,
            "base_url": settings.OUI1_BASE_URL,
            "message": "OpenUI generative UI integration is disabled in settings.",
            "mode": "cascade_fallback"
        }

    url = f"{settings.OUI1_BASE_URL.rstrip('/')}/models"
    headers = {}
    if settings.OUI1_API_KEY and settings.OUI1_API_KEY != "EMPTY":
        headers["Authorization"] = f"Bearer {settings.OUI1_API_KEY}"

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url, headers=headers)
            latency = round((time.time() - start_time) * 1000, 1)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("id") for m in data.get("data", [])]
                return {
                    "configured": True,
                    "connected": True,
                    "model": settings.OUI1_MODEL,
                    "base_url": settings.OUI1_BASE_URL,
                    "latency_ms": latency,
                    "available_models": models,
                    "mode": "dedicated_vllm_oui1",
                    "message": f"OUI-1 vLLM endpoint connected ({latency}ms). Token-diffusion UI streaming active."
                }
    except Exception as e:
        pass

    # If local vLLM is not running, return cascade fallback status
    return {
        "configured": True,
        "connected": False,
        "model": settings.OUI1_MODEL,
        "base_url": settings.OUI1_BASE_URL,
        "mode": "cascade_openui_dsl",
        "message": "OUI-1 vLLM endpoint offline. Active: Cascade Fallback (Gemini 2.5 Flash / OpenRouter / NVIDIA NIM with OpenUI DSL)."
    }

