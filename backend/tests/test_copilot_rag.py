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
