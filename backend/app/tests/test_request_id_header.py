def test_health_includes_request_id_header(client) -> None:
    test_client, _db = client
    response = test_client.get("/health")
    assert response.status_code == 200
    assert "X-Request-Id" in response.headers
    assert len(response.headers["X-Request-Id"]) >= 16

