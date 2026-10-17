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

    # 1. Test Feature Planner Mode
    res_planner = client.post(
        "/api/v1/chat/message",
        json={
            "message": "Design an automated Stripe subscription billing system with webhooks",
            "mode": "planner",
        },
        headers=headers,
    )
    assert res_planner.status_code == 200
    data_planner = res_planner.json()
    assert data_planner["mode"] == "planner"
    assert len(data_planner["response"]) > 20
    assert "tier_used" in data_planner

    # 2. Test Market Researcher Mode
    res_researcher = client.post(
        "/api/v1/chat/message",
        json={
            "message": "Who are the competitors for a GitHub repository project manager?",
            "mode": "researcher",
        },
        headers=headers,
    )
    assert res_researcher.status_code == 200
    data_researcher = res_researcher.json()
    assert data_researcher["mode"] == "researcher"
    assert len(data_researcher["response"]) > 20

    # 3. Test The Brutal Judge Mode
    res_judge = client.post(
        "/api/v1/chat/message",
        json={
            "message": "I want to rebuild Twitter from scratch on a blockchain using 15 microservices",
            "mode": "judge",
        },
        headers=headers,
    )
    assert res_judge.status_code == 200
    data_judge = res_judge.json()
    assert data_judge["mode"] == "judge"
    assert data_judge["judge_data"] is not None
    assert 0 <= data_judge["judge_data"]["score"] <= 100
    assert data_judge["judge_data"]["verdict_signal"] in [
        "BUILD_NOW",
        "PROCEED_WITH_CAUTION",
        "DO_NOT_BUILD",
    ]
    assert len(data_judge["judge_data"]["brutal_critique"]) > 10

    # 4. Test Qdrant Status & Knowledge Sync Endpoints
    res_status = client.get("/api/v1/chat/qdrant-status", headers=headers)
    assert res_status.status_code == 200
    assert "collection" in res_status.json()

    res_sync = client.post("/api/v1/chat/sync-knowledge", headers=headers)
    assert res_sync.status_code == 200
    assert res_sync.json()["status"] == "success"
