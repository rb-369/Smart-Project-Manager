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
