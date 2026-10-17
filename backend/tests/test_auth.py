from fastapi.testclient import TestClient
from app.core.config import settings


def test_auth_registration_and_login_flow(client: TestClient):
    # 1. Register new user
    register_payload = {
        "email": "janedoe@example.com",
        "password": "PasswordSecure123!",
        "full_name": "Jane Doe",
        "github_username": "janedoe"
    }
    reg_resp = client.post(f"{settings.API_V1_STR}/auth/register", json=register_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "tokens" in reg_data
    assert "access_token" in reg_data["tokens"]
    assert "refresh_token" in reg_data["tokens"]
    assert reg_data["user"]["email"] == "janedoe@example.com"
    assert reg_data["user"]["full_name"] == "Jane Doe"

    access_token = reg_data["tokens"]["access_token"]
    refresh_token = reg_data["tokens"]["refresh_token"]

    # 2. Reject duplicate registration
    dup_resp = client.post(f"{settings.API_V1_STR}/auth/register", json=register_payload)
    assert dup_resp.status_code == 400

    # 3. Access /me with Bearer token
    me_resp = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "janedoe@example.com"

    # 4. Access /me without token -> 401
    unauth_resp = client.get(f"{settings.API_V1_STR}/auth/me")
    assert unauth_resp.status_code == 401

    # 5. Login with credentials
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "janedoe@example.com", "password": "PasswordSecure123!"}
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()["tokens"]

    # 6. Login with invalid password -> 401
    bad_login = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "janedoe@example.com", "password": "WrongPassword!"}
    )
    assert bad_login.status_code == 401

    # 7. Refresh token
    refresh_resp = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()


def test_github_oauth_url_and_mongodb_status(client: TestClient):
    # Test GitHub OAuth URL endpoint returns valid payload
    gh_url_resp = client.get(f"{settings.API_V1_STR}/auth/github/url")
    assert gh_url_resp.status_code == 200
    data = gh_url_resp.json()
    assert "configured" in data

    # Test MongoDB status endpoint
    mongo_resp = client.get(f"{settings.API_V1_STR}/mongodb/status")
    assert mongo_resp.status_code == 200
    mongo_data = mongo_resp.json()
    assert "configured" in mongo_data
    assert "connected" in mongo_data


def test_user_separation_with_demo_accounts(client: TestClient):
    # 1. Switch to Alice
    alice_resp = client.post(
        f"{settings.API_V1_STR}/auth/demo-switch",
        json={"account": "alice"}
    )
    assert alice_resp.status_code == 200
    alice_token = alice_resp.json()["tokens"]["access_token"]
    alice_user = alice_resp.json()["user"]
    assert alice_user["email"] == "alice.dev@devcommand.ai"

    # 2. Switch to Bob
    bob_resp = client.post(
        f"{settings.API_V1_STR}/auth/demo-switch",
        json={"account": "bob"}
    )
    assert bob_resp.status_code == 200
    bob_token = bob_resp.json()["tokens"]["access_token"]
    bob_user = bob_resp.json()["user"]
    assert bob_user["email"] == "bob.lead@devcommand.ai"

    # Alice and Bob must have distinct IDs
    assert alice_user["id"] != bob_user["id"]

    # 3. Verify Alice only sees Alice's projects
    alice_projects = client.get(
        f"{settings.API_V1_STR}/projects",
        headers={"Authorization": f"Bearer {alice_token}"}
    ).json()

    # 4. Verify Bob only sees Bob's projects
    bob_projects = client.get(
        f"{settings.API_V1_STR}/projects",
        headers={"Authorization": f"Bearer {bob_token}"}
    ).json()

    alice_names = [p["name"] for p in alice_projects]
    bob_names = [p["name"] for p in bob_projects]

    # No cross-contamination between users!
    assert all("Alice" in name for name in alice_names if "Alice" in name)
    assert not any("Bob" in name for name in alice_names)
    assert not any("Alice" in name for name in bob_names)

