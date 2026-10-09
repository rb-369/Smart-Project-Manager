import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models.user import User
from app.models.project import Project
from app.core.security import hash_password, create_access_token


@pytest.fixture
def auth_header(session: Session) -> dict:
    user = User(
        email="octocat@example.com",
        password_hash=hash_password("octopass123"),
        full_name="Mona Lisa",
        github_username="octocat"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


def test_github_token_and_status(client: TestClient, auth_header: dict):
    # Check initial status (not connected)
    status_resp = client.get(f"{settings.API_V1_STR}/github/status", headers=auth_header)
    assert status_resp.status_code == 200
    assert status_resp.json()["is_connected"] is False

    # Save PAT token
    save_resp = client.post(
        f"{settings.API_V1_STR}/github/token",
        json={"token": "ghp_mock_token_1234567890abcdef"},
        headers=auth_header
    )
    assert save_resp.status_code == 200

    # Status should now be connected
    status_resp2 = client.get(f"{settings.API_V1_STR}/github/status", headers=auth_header)
    assert status_resp2.status_code == 200
    assert status_resp2.json()["is_connected"] is True


@pytest.mark.asyncio
async def test_github_sync_mock(client: TestClient, auth_header: dict, session: Session):
    # Set token first
    client.post(
        f"{settings.API_V1_STR}/github/token",
        json={"token": "ghp_mock_token_1234567890abcdef"},
        headers=auth_header
    )

    mock_repos = [
        {
            "id": 101,
            "name": "react-flow-builder",
            "full_name": "octocat/react-flow-builder",
            "description": "Visual diagram builder in React",
            "html_url": "https://github.com/octocat/react-flow-builder",
            "language": "TypeScript",
            "stargazers_count": 42,
            "forks_count": 5,
            "default_branch": "main",
        },
        {
            "id": 102,
            "name": "fastapi-microservice",
            "full_name": "octocat/fastapi-microservice",
            "description": "High performance async microservice",
            "html_url": "https://github.com/octocat/fastapi-microservice",
            "language": "Python",
            "stargazers_count": 12,
            "forks_count": 1,
            "default_branch": "main",
        }
    ]

    with patch("app.services.github_service.GitHubService.fetch_user_repositories", new_callable=AsyncMock) as mock_fetch, \
         patch("app.services.github_service.GitHubService.fetch_repo_readme", new_callable=AsyncMock) as mock_readme:
        
        mock_fetch.return_value = mock_repos
        mock_readme.return_value = "# React Flow Builder\nA diagramming tool"

        sync_resp = client.post(f"{settings.API_V1_STR}/github/sync", headers=auth_header)
        assert sync_resp.status_code == 200
        data = sync_resp.json()
        assert data["new_repos_imported"] == 2
        assert "react-flow-builder" in data["imported_repo_names"]

        # Verify Projects were added to database marked needs_review=True
        projects = session.exec(select(Project)).all()
        assert len(projects) == 2
        assert any(p.name == "react-flow-builder" and p.needs_review is True for p in projects)
