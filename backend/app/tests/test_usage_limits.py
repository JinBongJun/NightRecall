from app.db.models.question import Question, QuestionSchedule
from app.db.models.study import StudyInput, StudyTopic


def test_image_extract_is_limited_per_day(client, monkeypatch) -> None:
    test_client, _ = client

    from app.db.schemas.study_inputs import ExtractedPointResponse, StudyInputExtractResponse
    from app.services.study_extract_service import StudyExtractService

    def fake_extract(self, payload):  # noqa: ANN001
        return StudyInputExtractResponse(
            source_preview="Photo capture",
            points=[ExtractedPointResponse(text="Wheel lock on the scooter")],
        )

    monkeypatch.setattr(StudyExtractService, "extract", fake_extract)

    payload = {
        "source_type": "image",
        "image_base64": "abc123",
        "image_mime_type": "image/jpeg",
    }

    for _ in range(3):
        response = test_client.post("/v1/study-inputs/extract", json=payload)
        assert response.status_code == 200

    limited = test_client.post("/v1/study-inputs/extract", json=payload)
    assert limited.status_code == 422
    assert limited.json()["detail"] == "photo_extraction_limit_reached"


def test_image_extract_job_completes_and_is_pollable(client, monkeypatch) -> None:
    test_client, _ = client

    from app.db.schemas.study_inputs import ExtractedPointResponse, StudyInputExtractResponse
    from app.services.study_extract_service import StudyExtractService

    def fake_extract(self, payload):  # noqa: ANN001
        return StudyInputExtractResponse(
            source_preview="Photo capture",
            points=[ExtractedPointResponse(text="Wheel lock on the scooter")],
        )

    monkeypatch.setattr(StudyExtractService, "extract", fake_extract)

    payload = {
        "source_type": "image",
        "image_base64": "abc123",
        "image_mime_type": "image/jpeg",
    }

    response = test_client.post("/v1/study-inputs/extract/jobs", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert data["job_id"]
    assert data["status"] in {"queued", "running", "succeeded"}

    job_id = data["job_id"]
    for _ in range(20):
        polled = test_client.get(f"/v1/study-inputs/extract/jobs/{job_id}")
        assert polled.status_code == 200
        job = polled.json()
        if job["status"] == "succeeded":
            assert job["source_preview"] == "Photo capture"
            assert len(job["points"]) == 1
            assert job["points"][0]["text"] == "Wheel lock on the scooter"
            return

    raise AssertionError("study input extract job did not complete in time")


def test_question_generation_is_limited_per_day(client, monkeypatch) -> None:
    test_client, db = client

    from app.db.schemas.questions import QuestionOutput
    from app.services.llm_service import LLMService

    db.add(
        StudyInput(
            id="si_limit",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for question generation limit coverage.",
            source_kind="manual",
        )
    )
    db.add(
        StudyTopic(
            id="tp_limit",
            study_input_id="si_limit",
            user_id="usr_test",
            topic_text="Wheel lock detail",
            is_starred=True,
        )
    )
    db.commit()

    def fake_generate_question(**kwargs):  # noqa: ANN003
        return QuestionOutput(
            id="pending",
            question_type="mcq",
            question_text="Which detail matches the note?",
            choices=["Wheel lock", "Helmet color", "Fuel gauge", "License plate"],
            answer_index=0,
            answer_text=None,
            explanation="The note mentioned the wheel lock.",
        )

    monkeypatch.setattr(LLMService, "generate_question", fake_generate_question)

    first_payload = {"study_input_id": "si_limit", "count": 2}
    second_payload = {"study_input_id": "si_limit", "count": 1}
    blocked_payload = {"study_input_id": "si_limit", "count": 1}

    first = test_client.post("/v1/questions/generate", json=first_payload)
    assert first.status_code == 201
    assert len(first.json()["questions"]) == 2

    second = test_client.post("/v1/questions/generate", json=second_payload)
    assert second.status_code == 201
    assert len(second.json()["questions"]) == 1

    limited = test_client.post("/v1/questions/generate", json=blocked_payload)
    assert limited.status_code == 422
    assert limited.json()["detail"] == "question_generation_daily_limit_reached"


def test_question_generation_job_completes_and_is_pollable(client, monkeypatch) -> None:
    test_client, db = client

    from app.db.schemas.questions import QuestionOutput
    from app.services.llm_service import LLMService

    db.add(
        StudyInput(
            id="si_job",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for question generation job coverage.",
            source_kind="manual",
        )
    )
    db.add(
        StudyTopic(
            id="tp_job",
            study_input_id="si_job",
            user_id="usr_test",
            topic_text="Wheel lock detail",
            is_starred=True,
        )
    )
    db.commit()

    def fake_generate_question(**kwargs):  # noqa: ANN003
        return QuestionOutput(
            id="pending",
            question_type="mcq",
            question_text="Which detail matches the note?",
            choices=["Wheel lock", "Helmet color", "Fuel gauge", "License plate"],
            answer_index=0,
            answer_text=None,
            explanation="The note mentioned the wheel lock.",
        )

    monkeypatch.setattr(LLMService, "generate_question", fake_generate_question)

    response = test_client.post("/v1/questions/jobs", json={"study_input_id": "si_job", "count": 2})
    assert response.status_code == 202
    payload = response.json()
    assert payload["status"] in {"queued", "running", "succeeded"}
    assert payload["job_id"]

    job_id = payload["job_id"]
    for _ in range(20):
        polled = test_client.get(f"/v1/questions/jobs/{job_id}")
        assert polled.status_code == 200
        data = polled.json()
        if data["status"] == "succeeded":
            assert len(data["questions"]) == 2
            assert data["questions"][0]["question_text"] == "Which detail matches the note?"
            return

    raise AssertionError("question generation job did not complete in time")


def test_usage_limits_endpoint_reports_remaining(client, monkeypatch) -> None:
    test_client, db = client

    from app.db.schemas.study_inputs import ExtractedPointResponse, StudyInputExtractResponse
    from app.services.study_extract_service import StudyExtractService

    def fake_extract(self, payload):  # noqa: ANN001
        return StudyInputExtractResponse(
            source_preview="Photo capture",
            points=[ExtractedPointResponse(text="Wheel lock on the scooter")],
        )

    monkeypatch.setattr(StudyExtractService, "extract", fake_extract)

    payload = {
        "source_type": "image",
        "image_base64": "abc123",
        "image_mime_type": "image/jpeg",
    }

    response = test_client.get("/v1/usage/limits")
    assert response.status_code == 200
    data = response.json()
    assert data["photo_extract_daily"]["limit"] == 3
    assert data["photo_extract_daily"]["used"] == 0
    assert data["photo_extract_daily"]["remaining"] == 3

    test_client.post("/v1/study-inputs/extract", json=payload)

    response = test_client.get("/v1/usage/limits")
    assert response.status_code == 200
    data = response.json()
    assert data["photo_extract_daily"]["used"] == 1
    assert data["photo_extract_daily"]["remaining"] == 2


def test_question_limits_endpoint_reports_generated_question_count(client, monkeypatch) -> None:
    test_client, db = client

    from app.db.schemas.questions import QuestionOutput
    from app.services.llm_service import LLMService

    db.add(
        StudyInput(
            id="si_limit_usage",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for question generation usage reporting coverage.",
            source_kind="manual",
        )
    )
    db.add(
        StudyTopic(
            id="tp_limit_usage",
            study_input_id="si_limit_usage",
            user_id="usr_test",
            topic_text="Wheel lock detail",
            is_starred=True,
        )
    )
    db.commit()

    def fake_generate_question(**kwargs):  # noqa: ANN003
        return QuestionOutput(
            id="pending",
            question_type="mcq",
            question_text="Which detail matches the note?",
            choices=["Wheel lock", "Helmet color", "Fuel gauge", "License plate"],
            answer_index=0,
            answer_text=None,
            explanation="The note mentioned the wheel lock.",
        )

    monkeypatch.setattr(LLMService, "generate_question", fake_generate_question)

    generated = test_client.post("/v1/questions/generate", json={"study_input_id": "si_limit_usage", "count": 2})
    assert generated.status_code == 201

    response = test_client.get("/v1/usage/limits")
    assert response.status_code == 200
    data = response.json()
    assert data["question_generation_daily"]["limit"] == 3
    assert data["question_generation_daily"]["used"] == 2
    assert data["question_generation_daily"]["remaining"] == 1


def test_entitlements_endpoint_defaults_to_free(client) -> None:
    test_client, _ = client

    response = test_client.get("/v1/entitlements")
    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "free"
    assert data["billing_enabled"] is False
