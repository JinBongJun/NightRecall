def test_health_reports_database_ok(client) -> None:
    test_client, _db = client
    response = test_client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "ok"


def test_health_returns_service_unavailable_when_database_check_fails(client, monkeypatch) -> None:
    test_client, _db = client

    def fail_database_check() -> bool:
        return False

    monkeypatch.setattr("app.main.check_database", fail_database_check)

    response = test_client.get("/health")

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "degraded"
    assert payload["database"] == "unavailable"
