import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models.user import User
from app.models.project import Project
from app.models.ai_log import AILog
from app.models.enums import ProjectType, ProjectStatus, RecommendationType
from app.core.security import hash_password, create_access_token


@pytest.fixture
def user_and_project(session: Session) -> tuple[dict, Project]:
    user = User(
        email="ai_tester@example.com",
        password_hash=hash_password("aipass123"),
        full_name="AI Tester"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    project = Project(
        user_id=user.id,
        name="finance-tracker-ai",
        description="Expense tracker with OCR receipt scanning",
        primary_language="Python",
        project_type=ProjectType.PRODUCTION,
        status=ProjectStatus.IN_PROGRESS,
        goal="Automate monthly budgeting with 95% receipt accuracy",
        readme_content="# Finance Tracker AI\nScan receipts and track money."
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}
    return headers, project


@pytest.mark.asyncio
async def test_ai_triage_fallback_to_heuristic(client: TestClient, user_and_project: tuple[dict, Project], session: Session):
    headers, project = user_and_project

    # When no external keys are present, it falls back seamlessly to the heuristic fallback
    resp = client.post(f"{settings.API_V1_STR}/ai/triage/{project.id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_id"] == str(project.id)
    assert "suggested_project_type" in data
    assert "suggested_goal" in data
    assert len(data["suggested_initial_features"]) > 0

    # Verify AILog record was saved
    ai_logs = session.exec(select(AILog).where(AILog.project_id == project.id)).all()
    assert len(ai_logs) == 1
    assert ai_logs[0].recommendation_type == RecommendationType.TRIAGE


@pytest.mark.asyncio
async def test_ai_triage_openrouter_cascade(client: TestClient, user_and_project: tuple[dict, Project]):
    headers, project = user_and_project

    mock_llm_json = """{
        "suggested_project_type": "PRODUCTION",
        "suggested_goal": "Launch automated receipt accounting app with bank sync",
        "suggested_initial_features": [
            {"title": "OCR Receipt Engine", "description": "Extract text via Tesseract", "priority": "P0"},
            {"title": "Plaid Bank Connection", "description": "Sync checking accounts", "priority": "P1"}
        ]
    }"""

    with patch("app.services.ai_service.AIService._call_openrouter", new_callable=AsyncMock) as mock_or:
        mock_or.return_value = mock_llm_json

        resp = client.post(f"{settings.API_V1_STR}/ai/triage/{project.id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider_used"] == "openrouter"
        assert data["suggested_project_type"] == "PRODUCTION"
        assert len(data["suggested_initial_features"]) == 2


@pytest.mark.asyncio
async def test_ai_suggest_features_and_projects(client: TestClient, user_and_project: tuple[dict, Project]):
    headers, project = user_and_project

    # Test suggest features
    feat_resp = client.post(f"{settings.API_V1_STR}/ai/suggest-features/{project.id}", headers=headers)
    assert feat_resp.status_code == 200
    feat_data = feat_resp.json()
    assert "features" in feat_data
    assert len(feat_data["features"]) >= 3

    # Test suggest future projects
    proj_resp = client.post(f"{settings.API_V1_STR}/ai/suggest-projects", headers=headers)
    assert proj_resp.status_code == 200
    proj_data = proj_resp.json()
    assert "projects" in proj_data
    assert len(proj_data["projects"]) == 3
