from app.db.models.waitlist import WaitlistSignup


def test_waitlist_signup_is_stored_and_upserted(client) -> None:
    test_client, db = client

    first = test_client.post(
        "/v1/waitlist/signups",
        json={"email": "Tester@Example.com", "source": "landing-page"},
    )
    assert first.status_code == 201
    first_payload = first.json()
    assert first_payload["email"] == "tester@example.com"
    assert first_payload["signup_count"] == 1
    assert first_payload["created_new"] is True

    second = test_client.post(
        "/v1/waitlist/signups",
        json={"email": "tester@example.com", "source": "landing-page"},
    )
    assert second.status_code == 201
    second_payload = second.json()
    assert second_payload["email"] == "tester@example.com"
    # A fast double-submit should not be counted as a second signup.
    assert second_payload["signup_count"] == 1
    assert second_payload["created_new"] is False

    assert db.query(WaitlistSignup).count() == 1
