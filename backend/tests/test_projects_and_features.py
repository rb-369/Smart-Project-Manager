import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models.user import User
from app.core.security import hash_password, create_access_token


@pytest.fixture
def auth_headers(session: Session) -> dict:
    user = User(
        email="builder@example.com",
        password_hash=hash_password("builderpass123"),
        full_name="Bob Builder",
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


def test_project_crud_and_progress_tracking(client: TestClient, auth_headers: dict):
    # 1. Create project
    create_payload = {
        "name": "enterprise-crm",
        "description": "Next-gen CRM with AI lead scoring",
        "project_type": "PRODUCTION",
        "goal": "Build CRM with 10k monthly active users",
        "primary_language": "TypeScript",
    }
    create_resp = client.post(f"{settings.API_V1_STR}/projects", json=create_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    proj_data = create_resp.json()
    proj_id = proj_data["id"]
    assert proj_data["progress_percentage"] == 0
    assert proj_data["total_features"] == 0

    # 2. Add Feature 1 (P0, Weight 4)
    f1_resp = client.post(
        f"{settings.API_V1_STR}/projects/{proj_id}/features",
        json={"title": "OAuth Login", "priority": "P0", "status": "BACKLOG"},
        headers=auth_headers,
    )
    assert f1_resp.status_code == 201
    f1_id = f1_resp.json()["id"]

    # 3. Add Feature 2 (P1, Weight 3)
    f2_resp = client.post(
        f"{settings.API_V1_STR}/projects/{proj_id}/features",
        json={"title": "Lead Table View", "priority": "P1", "status": "BACKLOG"},
        headers=auth_headers,
    )
    assert f2_resp.status_code == 201

    # Check progress before completion -> 0%
    detail_resp = client.get(f"{settings.API_V1_STR}/projects/{proj_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["progress_percentage"] == 0
    assert detail_resp.json()["total_features"] == 2

    # 4. Mark Feature 1 (P0) as DONE -> Weight done: 4 / 7 = 57%
    patch_f1 = client.patch(
        f"{settings.API_V1_STR}/features/{f1_id}",
        json={"status": "DONE"},
        headers=auth_headers,
    )
    assert patch_f1.status_code == 200
    assert patch_f1.json()["completed_at"] is not None

    detail_resp2 = client.get(f"{settings.API_V1_STR}/projects/{proj_id}", headers=auth_headers)
    assert detail_resp2.json()["progress_percentage"] == 57
    assert detail_resp2.json()["completed_features"] == 1

    # 5. Test manual progress override
    client.patch(
        f"{settings.API_V1_STR}/projects/{proj_id}",
        json={"use_manual_progress": True, "manual_progress_override": 85},
        headers=auth_headers,
    )
    detail_resp3 = client.get(f"{settings.API_V1_STR}/projects/{proj_id}", headers=auth_headers)
    assert detail_resp3.json()["progress_percentage"] == 85


def test_confirm_triage_flow(client: TestClient, auth_headers: dict):
    # Create project in needs_review state
    proj_resp = client.post(
        f"{settings.API_V1_STR}/projects",
        json={"name": "unreviewed-repo", "project_type": "RESUME"},
        headers=auth_headers,
    )
    proj_id = proj_resp.json()["id"]

    # Confirm triage with initial features
    confirm_payload = {
        "project_type": "COLLEGE",
        "goal": "Submit finalized operating systems assignment",
        "initial_features": [
            {"title": "Virtual Memory Paging", "priority": "P0"},
            {"title": "Thread Scheduler", "priority": "P1"},
        ]
    }
    confirm_resp = client.post(
        f"{settings.API_V1_STR}/projects/{proj_id}/confirm-triage",
        json=confirm_payload,
        headers=auth_headers,
    )
    assert confirm_resp.status_code == 200
    data = confirm_resp.json()
    assert data["needs_review"] is False
    assert data["project_type"] == "COLLEGE"
    assert data["total_features"] == 2


def test_future_projects_incubator_and_promotion(client: TestClient, auth_headers: dict):
    # 1. Create Future Project
    idea_payload = {
        "title": "Decentralized File Sync",
        "elevator_pitch": "P2P torrent-based file syncing for remote teams",
        "target_tech_stack": "Go + WebAssembly",
        "project_type": "PRODUCTION",
        "priority": "P0",
        "notes": "Look into libp2p"
    }
    idea_resp = client.post(f"{settings.API_V1_STR}/future-projects", json=idea_payload, headers=auth_headers)
    assert idea_resp.status_code == 201
    idea_id = idea_resp.json()["id"]
    assert idea_resp.json()["status"] == "IDEA"

    # 2. List ideas
    list_resp = client.get(f"{settings.API_V1_STR}/future-projects", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # 3. Promote idea to active Project
    promote_resp = client.post(
        f"{settings.API_V1_STR}/future-projects/{idea_id}/promote",
        json={"initial_goal": "Ship v1 beta to 10 testers"},
        headers=auth_headers,
    )
    assert promote_resp.status_code == 200
    new_proj = promote_resp.json()
    assert new_proj["name"] == "Decentralized File Sync"
    assert new_proj["goal"] == "Ship v1 beta to 10 testers"

    # Verify original idea is marked PROMOTED
    updated_ideas = client.get(f"{settings.API_V1_STR}/future-projects", headers=auth_headers).json()
    assert updated_ideas[0]["status"] == "PROMOTED"
    assert updated_ideas[0]["promoted_project_id"] == new_proj["id"]


def test_project_star_hide_live_url_and_reorder(client: TestClient, auth_headers: dict):
    """Test starring (pinned on top), soft-hiding, live URL support, and batch reordering."""
    # 1. Create three projects: P1, P2, P3
    p1 = client.post(
        f"{settings.API_V1_STR}/projects",
        json={"name": "alpha-tool", "order_index": 0},
        headers=auth_headers,
    ).json()
    p2 = client.post(
        f"{settings.API_V1_STR}/projects",
        json={"name": "beta-system", "order_index": 1},
        headers=auth_headers,
    ).json()
    p3 = client.post(
        f"{settings.API_V1_STR}/projects",
        json={"name": "gamma-prod", "order_index": 2, "live_url": "https://gamma.vercel.app"},
        headers=auth_headers,
    ).json()

    # 2. Toggle star on P2 -> P2 should be starred
    star_resp = client.patch(f"{settings.API_V1_STR}/projects/{p2['id']}/star", headers=auth_headers)
    assert star_resp.status_code == 200
    assert star_resp.json()["is_starred"] is True

    # Check that P2 sorts to the very top in list
    list_all = client.get(f"{settings.API_V1_STR}/projects", headers=auth_headers).json()
    # P2 should be first because it is starred
    assert list_all[0]["id"] == p2["id"]

    # 3. Soft-hide P1
    hide_resp = client.patch(f"{settings.API_V1_STR}/projects/{p1['id']}/hide", headers=auth_headers)
    assert hide_resp.status_code == 200
    assert hide_resp.json()["is_hidden"] is True

    # Listing projects with is_hidden=False should NOT include P1
    active_list = client.get(f"{settings.API_V1_STR}/projects?is_hidden=false", headers=auth_headers).json()
    assert not any(p["id"] == p1["id"] for p in active_list)

    # Listing projects with is_hidden=True should include P1
    hidden_list = client.get(f"{settings.API_V1_STR}/projects?is_hidden=true", headers=auth_headers).json()
    assert any(p["id"] == p1["id"] for p in hidden_list)

    # Unhide P1
    unhide_resp = client.patch(f"{settings.API_V1_STR}/projects/{p1['id']}/hide", headers=auth_headers)
    assert unhide_resp.status_code == 200
    assert unhide_resp.json()["is_hidden"] is False

    # 4. Live URL update
    update_live = client.patch(
        f"{settings.API_V1_STR}/projects/{p1['id']}",
        json={"live_url": "https://alpha.render.com"},
        headers=auth_headers,
    )
    assert update_live.status_code == 200
    assert update_live.json()["live_url"] == "https://alpha.render.com"

    # Query has_live_url=true -> should return P1 and P3
    prod_deployed = client.get(f"{settings.API_V1_STR}/projects?has_live_url=true", headers=auth_headers).json()
    live_ids = [p["id"] for p in prod_deployed]
    assert p1["id"] in live_ids
    assert p3["id"] in live_ids

    # 5. Batch Reorder
    reorder_resp = client.patch(
        f"{settings.API_V1_STR}/projects/reorder",
        json={"items": [{"id": p3["id"], "order_index": 0}, {"id": p1["id"], "order_index": 5}]},
        headers=auth_headers,
    )
    assert reorder_resp.status_code == 200
    reordered = reorder_resp.json()
    p3_updated = next(p for p in reordered if p["id"] == p3["id"])
    assert p3_updated["order_index"] == 0


def test_parse_raw_concept_endpoint(client: TestClient, auth_headers: dict):
    """Test AI extraction of messy WhatsApp message into structured concept and saving it."""
    raw_whatsapp_text = "yo bro what if we make a bot that automatically tweets git commits using python and fastapi. urgent asap"

    resp = client.post(
        f"{settings.API_V1_STR}/future-projects/parse-concept",
        json={"raw_text": raw_whatsapp_text},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "title" in data and len(data["title"]) > 0
    assert "elevator_pitch" in data and len(data["elevator_pitch"]) > 0
    assert "target_tech_stack" in data and len(data["target_tech_stack"]) > 0
    assert data["priority"] in ["P0", "P1", "P2"]
    assert data["project_type"] in ["RESUME", "COLLEGE", "PRODUCTION"]
    assert isinstance(data["starter_features"], list)
    assert len(data["starter_features"]) >= 1
    assert data["raw_message"] == raw_whatsapp_text

    # Save the parsed concept as a future project with raw_message
    create_resp = client.post(
        f"{settings.API_V1_STR}/future-projects",
        json={
            "title": data["title"],
            "elevator_pitch": data["elevator_pitch"],
            "target_tech_stack": data["target_tech_stack"],
            "project_type": data["project_type"],
            "priority": data["priority"],
            "notes": data["notes"],
            "raw_message": data["raw_message"],
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == data["title"]
    assert created["status"] == "IDEA"
    assert created["raw_message"] == raw_whatsapp_text


