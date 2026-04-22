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
