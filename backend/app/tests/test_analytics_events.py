from app.db.models.analytics_event import AnalyticsEvent
from app.db.models.study import StudyInput


def test_extract_records_analytics_event(client) -> None:
    test_client, db = client
    assert db.query(AnalyticsEvent).count() == 0

    response = test_client.post(
        "/v1/study-inputs/extract",
        json={"source_type": "text", "source_text": "this is a short note for extraction"},
    )
    assert response.status_code == 200
    assert db.query(AnalyticsEvent).count() == 1


def test_save_records_analytics_event(client) -> None:
    test_client, db = client
    db.query(AnalyticsEvent).delete()
    db.commit()
    assert db.query(AnalyticsEvent).count() == 0

    response = test_client.post(
        "/v1/study-inputs",
        json={
            "input_type": "keywords",
            "content": ["alpha", "beta", "gamma"],
            "starred_indices": [1],
            "source_kind": "manual",
        },
    )
    assert response.status_code == 201
    assert db.query(AnalyticsEvent).count() >= 1


def test_save_does_not_persist_source_image_blob(client) -> None:
    test_client, db = client

    upload = test_client.post(
        "/v1/study-inputs/source-images",
        json={
            "image_base64": "ZmFrZQ==",
            "image_mime_type": "image/png",
        },
    )
    assert upload.status_code == 201
    source_image_ref = upload.json()["source_image_ref"]

    response = test_client.post(
        "/v1/study-inputs",
        json={
            "input_type": "keywords",
            "content": ["alpha", "beta", "gamma"],
            "starred_indices": [1],
            "source_kind": "manual",
            "source_image_ref": source_image_ref,
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["source_image_ref"] == source_image_ref

    saved = db.query(StudyInput).one()
    assert saved.source_image_ref == source_image_ref

