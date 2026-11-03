import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.user import User
from app.models.project import Project, ProjectType, ProjectStatus
from app.core.security import create_access_token
from app.core.qdrant import check_qdrant_connection
from app.services.rag_service import RAGService


def test_qdrant_status_and_fastembed():
    """Verify Qdrant status check and FastEmbed 384-dimensional vector output."""
    status = check_qdrant_connection()
    assert "configured" in status
    assert "collection" in status
    assert "connected" in status

    # Verify FastEmbed ONNX embedding generation
    embedding = RAGService.get_embedding("Autonomous Roadmap Decomposer")
    assert isinstance(embedding, list)
    assert len(embedding) == 384
    assert all(isinstance(v, float) for v in embedding)


def test_rag_multi_tenant_isolation():
    """Verify that vector similarity search strictly enforces user_id segregation."""
    user1_id = uuid4()
    user2_id = uuid4()

    project1 = Project(
        id=uuid4(),
        user_id=user1_id,
        github_repo_id=10101,
        name="Alice-Exclusive-Solana-DEX",
        description="High-frequency Solana DEX smart contract",
        goal="Launch automated market maker on Solana testnet",
        project_type=ProjectType.PRODUCTION,
        status=ProjectStatus.IN_PROGRESS,
    )

    project2 = Project(
        id=uuid4(),
        user_id=user2_id,
        github_repo_id=20202,
        name="Bob-Secret-Rust-Compiler",
        description="LLVM based Rust compiler backend",
        goal="Compile subsets of Rust to WebAssembly",
        project_type=ProjectType.RESUME,
        status=ProjectStatus.IN_PROGRESS,
    )

    # Index both projects
    assert RAGService.index_project(project1, user1_id) is True
    assert RAGService.index_project(project2, user2_id) is True

    # User 1 searches: should find Solana, NEVER Rust compiler
    user1_hits = RAGService.search_knowledge(
        query="smart contract DEX market maker",
        user_id=user1_id,
        limit=5,
    )
    assert len(user1_hits) > 0
    assert any("Alice-Exclusive-Solana-DEX" in h["title"] for h in user1_hits)
    assert not any("Bob-Secret-Rust-Compiler" in h["title"] for h in user1_hits)

    # User 2 searches: should find Rust compiler, NEVER Solana DEX
    user2_hits = RAGService.search_knowledge(
        query="compiler LLVM WebAssembly",
        user_id=user2_id,
        limit=5,
    )
    assert len(user2_hits) > 0
    assert any("Bob-Secret-Rust-Compiler" in h["title"] for h in user2_hits)
    assert not any("Alice-Exclusive-Solana-DEX" in h["title"] for h in user2_hits)


def test_copilot_chat_modes_and_endpoints(client: TestClient, session: Session):
    """Test /api/v1/chat/message across planner, researcher, and judge modes."""
    # Create test user
    user = User(
        email="copilot.tester@devcommand.ai",
        password_hash="testpasshash",
        full_name="Copilot Tester",
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test Unified Sub-Agent Pipeline on a Feature Idea
    res_pipeline = client.post(
        "/api/v1/chat/message",
        json={
            "message": "Design an automated Stripe subscription billing system with webhooks",
            "mode": "auto",
        },
        headers=headers,
    )
    assert res_pipeline.status_code == 200
    data_pipe = res_pipeline.json()
    assert data_pipe["mode"] in ["pipeline", "planner"]
    assert len(data_pipe["response"]) > 10
    assert "tier_used" in data_pipe
    assert data_pipe["subagent_data"] is not None
    assert "researcher" in data_pipe["subagent_data"]
    assert "judge" in data_pipe["subagent_data"]
    assert "planner" in data_pipe["subagent_data"]

    # 2. Test The Brutal Judge & Smart Pivot Pipeline on a flawed idea
    res_flawed = client.post(
        "/api/v1/chat/message",
        json={
            "message": "I want to rebuild Twitter from scratch on a blockchain using 15 microservices",
            "mode": "auto",
        },
        headers=headers,
    )
    assert res_flawed.status_code == 200
    data_flawed = res_flawed.json()
    assert data_flawed["judge_data"] is not None
    assert 0 <= data_flawed["judge_data"]["score"] <= 100
    assert data_flawed["judge_data"]["verdict_signal"] in [
        "BUILD_NOW",
        "PROCEED_WITH_CAUTION",
        "DO_NOT_BUILD",
    ]
    # Check that Smart Pivot Plan is provided if rejected
    if data_flawed["judge_data"]["verdict_signal"] == "DO_NOT_BUILD" or data_flawed["judge_data"]["score"] < 50:
        assert data_flawed["subagent_data"].get("pivot_plan") is not None
        assert "content" in data_flawed["subagent_data"]["pivot_plan"]

    # 3. Test MongoDB Cloud History Retrieval & Clear Endpoints
    res_hist = client.get("/api/v1/chat/history", headers=headers)
    assert res_hist.status_code == 200
    assert res_hist.json()["status"] == "success"

    res_del = client.delete("/api/v1/chat/history", headers=headers)
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"

    # 4. Test Qdrant Status & Knowledge Sync Endpoints
    res_status = client.get("/api/v1/chat/qdrant-status", headers=headers)
    assert res_status.status_code == 200
    assert "collection" in res_status.json()

    res_sync = client.post("/api/v1/chat/sync-knowledge", headers=headers)
    assert res_sync.status_code == 200
    assert res_sync.json()["status"] == "success"


def test_orchestrator_eval_skill_routing():
    """Verify that CopilotService.orchestrate_intent correctly distinguishes between general queries and /eval proposals."""
    from app.services.copilot_service import CopilotService

    # 1. Informational & Conversational queries -> FALSE (no 3-stage heavy pipeline)
    is_eval, clean = CopilotService.orchestrate_intent("what are my stats")
    assert is_eval is False
    assert clean == "what are my stats"

    is_eval, _ = CopilotService.orchestrate_intent("hello there")
    assert is_eval is False

    is_eval, _ = CopilotService.orchestrate_intent("explain how the auth middleware works")
    assert is_eval is False

    is_eval, _ = CopilotService.orchestrate_intent("fix this error in api client")
    assert is_eval is False

    # 2. Explicit /eval skill invocation -> TRUE (clean string stripped)
    is_eval, clean = CopilotService.orchestrate_intent("/eval Automated WhatsApp Concept Importer")
    assert is_eval is True
    assert clean == "Automated WhatsApp Concept Importer"

    is_eval, clean = CopilotService.orchestrate_intent("/evaluate AI Driven Test Scaffolder")
    assert is_eval is True
    assert clean == "AI Driven Test Scaffolder"

    # 3. Explicit evaluation trigger phrases -> TRUE
    is_eval, _ = CopilotService.orchestrate_intent("should we build biometric auth for mobile")
    assert is_eval is True

    is_eval, _ = CopilotService.orchestrate_intent("evaluate this idea: background queue for video processing")
    assert is_eval is True

    # 4. Explicit mode override
    is_eval, _ = CopilotService.orchestrate_intent("general idea summary", mode="chat")
    assert is_eval is False

    is_eval, _ = CopilotService.orchestrate_intent("general idea summary", mode="eval")
    assert is_eval is True


def test_multi_chat_sessions_and_user_isolation(client: TestClient, session: Session):
    """
    Test creating multiple chat sessions per user, switching between chats,
    and verify strict multi-tenant isolation (User B cannot access User A's chats).
    """
    # 1. Create User A and User B
    user_a = User(
        email="alice.sessions@devcommand.ai",
        password_hash="testpasshashA",
        full_name="Alice MultiChat",
        is_active=True,
    )
    user_b = User(
        email="bob.sessions@devcommand.ai",
        password_hash="testpasshashB",
        full_name="Bob MultiChat",
        is_active=True,
    )
    session.add(user_a)
    session.add(user_b)
    session.commit()
    session.refresh(user_a)
    session.refresh(user_b)

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. User A creates 2 distinct chat sessions
    res_a_s1 = client.post(
        "/api/v1/chat/sessions",
        json={"title": "WhatsApp Concept Evaluation"},
        headers=headers_a,
    )
    assert res_a_s1.status_code == 200
    s1_id = res_a_s1.json()["session"]["id"]

    res_a_s2 = client.post(
        "/api/v1/chat/sessions",
        json={"title": "Auth Architecture Discussion"},
        headers=headers_a,
    )
    assert res_a_s2.status_code == 200
    s2_id = res_a_s2.json()["session"]["id"]

    # 3. User A lists sessions -> should have 2
    res_list_a = client.get("/api/v1/chat/sessions", headers=headers_a)
    assert res_list_a.status_code == 200
    sessions_a = res_list_a.json()["sessions"]
    assert len(sessions_a) == 2
    assert any(s["id"] == s1_id for s in sessions_a)
    assert any(s["id"] == s2_id for s in sessions_a)

    # 4. User B lists sessions -> should have 0 (Strict user isolation!)
    res_list_b = client.get("/api/v1/chat/sessions", headers=headers_b)
    assert res_list_b.status_code == 200
    sessions_b = res_list_b.json()["sessions"]
    assert len(sessions_b) == 0

    # 5. User B attempts to access User A's session -> must return 404 Not Found
    res_b_forbidden = client.get(f"/api/v1/chat/sessions/{s1_id}", headers=headers_b)
    assert res_b_forbidden.status_code == 404

    # 6. User B attempts to delete User A's session -> must return 404 Not Found
    res_b_del_forbidden = client.delete(f"/api/v1/chat/sessions/{s1_id}", headers=headers_b)
    assert res_b_del_forbidden.status_code == 404

    # 7. User A renames session 1
    res_rename = client.patch(
        f"/api/v1/chat/sessions/{s1_id}",
        json={"title": "WhatsApp Concept Bot v2"},
        headers=headers_a,
    )
    assert res_rename.status_code == 200
    assert res_rename.json()["session"]["title"] == "WhatsApp Concept Bot v2"

    # 8. User A sends message in session 1
    res_msg = client.post(
        "/api/v1/chat/message",
        json={
            "session_id": s1_id,
            "message": "Hello from session 1",
            "mode": "chat",
        },
        headers=headers_a,
    )
    assert res_msg.status_code == 200
    assert res_msg.json()["session_id"] == s1_id

    # 9. Check session 1 messages
    res_s1_detail = client.get(f"/api/v1/chat/sessions/{s1_id}", headers=headers_a)
    assert res_s1_detail.status_code == 200
    s1_msgs = res_s1_detail.json()["messages"]
    assert len(s1_msgs) >= 2  # user message + assistant response
    assert s1_msgs[0]["content"] == "Hello from session 1"

    # 10. User A deletes session 2
    res_del_s2 = client.delete(f"/api/v1/chat/sessions/{s2_id}", headers=headers_a)
    assert res_del_s2.status_code == 200

    # List again: User A now has 1 session, User B still has 0
    res_after = client.get("/api/v1/chat/sessions", headers=headers_a)
    assert len(res_after.json()["sessions"]) == 1
    assert res_after.json()["sessions"][0]["id"] == s1_id


def test_slash_skills_resolution():
    """Verify that CopilotService.resolve_skill correctly handles all registered slash skills."""
    from app.services.copilot_service import CopilotService

    # /eval
    skill, clean = CopilotService.resolve_skill("/eval Live WebSocket Engine")
    assert skill == "eval"
    assert clean == "Live WebSocket Engine"

    # /plan
    skill, clean = CopilotService.resolve_skill("/plan Rate Limiting Middleware with Redis")
    assert skill == "plan"
    assert clean == "Rate Limiting Middleware with Redis"

    # /research
    skill, clean = CopilotService.resolve_skill("/research Vector search benchmarks vs Qdrant")
    assert skill == "research"
    assert clean == "Vector search benchmarks vs Qdrant"

    # /audit
    skill, clean = CopilotService.resolve_skill("/audit OAuth2 token refresh & revoke lifecycle")
    assert skill == "audit"
    assert clean == "OAuth2 token refresh & revoke lifecycle"

    # /openui
    skill, clean = CopilotService.resolve_skill("/openui High-density telemetry dashboard")
    assert skill == "openui"
    assert clean == "High-density telemetry dashboard"

    # /stats
    skill, clean = CopilotService.resolve_skill("/stats")
    assert skill == "stats"

    # /pivot
    skill, clean = CopilotService.resolve_skill("/pivot Over-engineered microservices architecture")
    assert skill == "pivot"
    assert clean == "Over-engineered microservices architecture"

    # /help
    skill, _ = CopilotService.resolve_skill("/help")
    assert skill == "help"


def test_tagged_mentions_and_slash_skills_endpoint(client: TestClient, session: Session):
    """Test calling /api/v1/chat/message with @project, #idea, and slash skills."""
    from app.models.future_project import FutureProject

    user = User(
        email="tagtester@devcommand.ai",
        password_hash="testpasshashTags",
        full_name="Tag Tester",
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Add a project
    proj = Project(
        id=uuid4(),
        user_id=user.id,
        name="notes-management",
        html_url="https://github.com/owner/notes-management",
        description="Markdown notes manager with offline sync",
        primary_language="Python",
        project_type=ProjectType.PRODUCTION,
        status=ProjectStatus.IN_PROGRESS,
    )
    session.add(proj)

    # Add an incubator idea
    idea = FutureProject(
        id=uuid4(),
        user_id=user.id,
        title="AI-concept-importer",
        elevator_pitch="Instant WhatsApp and Slack idea crawler",
        target_tech_stack="Python, FastAPI, OpenAI",
        notes="High leverage MVP slice",
    )
    session.add(idea)
    session.commit()

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test /plan with @project and #idea tagging
    res_plan = client.post(
        "/api/v1/chat/message",
        json={
            "message": "/plan architectural boundaries for @notes-management based on #AI-concept-importer",
            "mode": "auto",
        },
        headers=headers,
    )
    assert res_plan.status_code == 200
    data_plan = res_plan.json()
    assert data_plan["mode"] == "plan"
    assert len(data_plan["suggested_features"]) > 0
    assert data_plan["subagent_data"]["planner"] is not None

    # 2. Test /audit skill
    res_audit = client.post(
        "/api/v1/chat/message",
        json={
            "message": "/audit security vulnerabilities and IDOR for @notes-management",
            "mode": "auto",
        },
        headers=headers,
    )
    assert res_audit.status_code == 200
    data_audit = res_audit.json()
    assert data_audit["mode"] == "audit"
    assert data_audit["subagent_data"]["auditor"] is not None

    # 3. Test /help skill
    res_help = client.post(
        "/api/v1/chat/message",
        json={"message": "/help", "mode": "auto"},
        headers=headers,
    )
    assert res_help.status_code == 200
    data_help = res_help.json()
    assert data_help["mode"] == "help"
    assert "DevCommand Copilot Command & Syntax Guide" in data_help["response"]



