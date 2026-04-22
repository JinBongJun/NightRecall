from __future__ import annotations

from types import SimpleNamespace

from app.db.models.ops_event import OpsEvent


def test_ops_digest_requires_token(unauthorized_client) -> None:
    response = unauthorized_client.get("/v1/ops/digest")
    assert response.status_code in (403, 503)


def test_ops_alert_run_requires_token(unauthorized_client) -> None:
    response = unauthorized_client.post("/v1/ops/alert-run")
    assert response.status_code in (403, 503)


def test_ops_digest_works_with_token(client, monkeypatch) -> None:
    test_client, db = client

    # Seed one ops event so digest has something to count.
    db.add(
        OpsEvent(
            id="ops_seed",
            request_id="req_seed",
            route="/health",
            method="GET",
            status_code=500,
            duration_ms=10,
            user_id_nullable=None,
            ip_hash_nullable="ip",
            kind="http",
            detail=None,
        )
    )
    db.commit()

    import app.core.config as config_mod

    settings = config_mod.get_settings()
    monkeypatch.setattr(settings, "ops_cron_token", "tok_test", raising=False)

    response = test_client.get("/v1/ops/digest", headers={"X-Ops-Token": "tok_test"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["http_5xx"] >= 1


def test_ops_alert_run_sends_slack_once_and_is_idempotent(client, monkeypatch) -> None:
    test_client, db = client

    # Hit the default threshold (>=3 5xx) so it should alert.
    for i in range(3):
        db.add(
            OpsEvent(
                id=f"ops_5xx_{i}",
                request_id=f"req_5xx_{i}",
                route="/v1/stats",
                method="GET",
                status_code=500,
                duration_ms=10,
                user_id_nullable=None,
                ip_hash_nullable="ip",
                kind="http",
                detail=None,
            )
        )
    db.commit()

    import app.core.config as config_mod
    import app.services.ops_alert_service as ops_mod

    settings = config_mod.get_settings()
    monkeypatch.setattr(settings, "ops_cron_token", "tok_test", raising=False)
    monkeypatch.setattr(settings, "ops_slack_webhook_url", "https://example.com/webhook", raising=False)

    calls: list[dict] = []

    def fake_post(url, json, timeout):  # type: ignore[no-untyped-def]
        calls.append({"url": url, "json": json, "timeout": timeout})
        return SimpleNamespace(status_code=200)

    monkeypatch.setattr(ops_mod.requests, "post", fake_post, raising=True)

    r1 = test_client.post("/v1/ops/alert-run", headers={"X-Ops-Token": "tok_test"})
    assert r1.status_code == 200
    assert r1.json()["sent"] is True
    assert len(calls) == 1

    # Second run in same window should not send again.
    r2 = test_client.post("/v1/ops/alert-run", headers={"X-Ops-Token": "tok_test"})
    assert r2.status_code == 200
    assert r2.json()["sent"] is False
    assert r2.json()["reason"] in ("already_sent", "below_threshold")
    assert len(calls) == 1


def test_ops_alert_run_retries_if_slack_failed_before(client, monkeypatch) -> None:
    test_client, db = client

    for i in range(3):
        db.add(
            OpsEvent(
                id=f"ops_5xx_retry_{i}",
                request_id=f"req_5xx_retry_{i}",
                route="/v1/stats",
                method="GET",
                status_code=500,
                duration_ms=10,
                user_id_nullable=None,
                ip_hash_nullable="ip",
                kind="http",
                detail=None,
            )
        )
    db.commit()

    import app.core.config as config_mod
    import app.services.ops_alert_service as ops_mod

    settings = config_mod.get_settings()
    monkeypatch.setattr(settings, "ops_cron_token", "tok_test", raising=False)
    monkeypatch.setattr(settings, "ops_slack_webhook_url", "https://example.com/webhook", raising=False)

    # First call fails, second succeeds.
    counter = {"n": 0}

    def fake_post(url, json, timeout):  # type: ignore[no-untyped-def]
        counter["n"] += 1
        if counter["n"] == 1:
            return SimpleNamespace(status_code=500)
        return SimpleNamespace(status_code=200)

    monkeypatch.setattr(ops_mod.requests, "post", fake_post, raising=True)

    r1 = test_client.post("/v1/ops/alert-run", headers={"X-Ops-Token": "tok_test"})
    assert r1.status_code == 200
    assert r1.json()["sent"] is False
    assert r1.json()["reason"] == "slack_failed"

    r2 = test_client.post("/v1/ops/alert-run", headers={"X-Ops-Token": "tok_test"})
    assert r2.status_code == 200
    assert r2.json()["sent"] is True
    assert r2.json()["reason"] == "ok"

