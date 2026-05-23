from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db.models.study import StudyInput
from app.db.models.user import User


def test_me_route_returns_authenticated_user(client) -> None:
    test_client, _ = client
    response = test_client.get("/v1/users/me")

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["id"] == "usr_test"


def test_me_route_requires_authentication(unauthorized_client) -> None:
    response = unauthorized_client.get("/v1/users/me")
    assert response.status_code == 401


def test_stats_route_is_accessible_for_authenticated_user(client) -> None:
    test_client, _ = client
    response = test_client.get("/v1/stats")

    assert response.status_code == 200
    payload = response.json()
    assert payload["current_streak"] == 0
    assert payload["total_answered"] == 0


def test_delete_me_removes_user_and_related_data(client) -> None:
    test_client, db = client
    db.add(
        StudyInput(
            id="si_test",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for deletion coverage.",
        )
    )
    db.commit()

    response = test_client.delete("/v1/users/me")

    assert response.status_code == 204
    assert db.get(User, "usr_test") is None
    remaining = db.query(StudyInput).filter(StudyInput.user_id == "usr_test").count()
    assert remaining == 0


def test_refresh_without_access_token(open_auth_client: TestClient) -> None:
    guest_response = open_auth_client.post(
        "/v1/users/guest/session",
        json={"timezone": "UTC", "locale": "en"},
    )
    assert guest_response.status_code == 201
    tokens = guest_response.json()["tokens"]

    refresh_response = open_auth_client.post(
        "/v1/users/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert refreshed["access_token"]
    assert refreshed["refresh_token"]
    assert refreshed["refresh_token"] != tokens["refresh_token"]

    me_response = open_auth_client.get(
        "/v1/users/me",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
    )
    assert me_response.status_code == 200


def test_refresh_with_expired_access_token(open_auth_client: TestClient) -> None:
    guest_response = open_auth_client.post(
        "/v1/users/guest/session",
        json={"timezone": "UTC", "locale": "en"},
    )
    assert guest_response.status_code == 201
    payload = guest_response.json()
    user_id = payload["user"]["id"]
    tokens = payload["tokens"]

    settings = get_settings()
    expired_access = jwt.encode(
        {
            "sub": user_id,
            "type": "access",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        },
        settings.jwt_secret_key,
        algorithm="HS256",
    )

    refresh_response = open_auth_client.post(
        "/v1/users/refresh",
        json={"refresh_token": tokens["refresh_token"]},
        headers={"Authorization": f"Bearer {expired_access}"},
    )

    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    me_response = open_auth_client.get(
        "/v1/users/me",
        headers={"Authorization": f"Bearer {refreshed['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["user"]["id"] == user_id


def test_refresh_rejects_invalid_refresh_token(open_auth_client: TestClient) -> None:
    settings = get_settings()
    invalid_refresh = jwt.encode(
        {
            "sub": "usr_missing",
            "sid": "ses_missing",
            "type": "refresh",
            "exp": datetime.now(UTC) + timedelta(days=1),
        },
        "wrong-secret",
        algorithm="HS256",
    )

    response = open_auth_client.post(
        "/v1/users/refresh",
        json={"refresh_token": invalid_refresh},
    )
    assert response.status_code == 401
