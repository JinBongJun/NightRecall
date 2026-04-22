from datetime import UTC, datetime

from app.db.models.question import Question
from app.db.models.review import ReviewEvent
from app.db.models.study import StudyInput, StudyTopic


def test_from_topic_requires_question_owner_scope(client) -> None:
    test_client, db = client
    db.add(
        StudyInput(
            id="si_other",
            user_id="usr_other",
            input_type="notes",
            raw_content="This is a sufficiently long note for another user.",
        )
    )
    db.add(
        StudyTopic(
            id="tp_other",
            study_input_id="si_other",
            user_id="usr_other",
            topic_text="Other user's topic",
            is_starred=True,
        )
    )
    db.add(
        Question(
            id="q_other",
            user_id="usr_other",
            study_input_id="si_other",
            study_topic_id="tp_other",
            question_type="mcq",
            question_text="Other user's question",
            choices_json=["A", "B", "C", "D"],
            answer_index=0,
            answer_text=None,
            explanation="Other user's explanation",
            source_hash="hash_other",
        )
    )
    db.commit()

    response = test_client.post("/v1/review/from-topic", json={"topic_id": "tp_other"})

    assert response.status_code == 404


def test_submit_answer_keeps_working_after_timezone_stats_refactor(client) -> None:
    test_client, db = client
    db.add(
        StudyInput(
            id="si_review",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for review submission coverage.",
        )
    )
    db.add(
        StudyTopic(
            id="tp_review",
            study_input_id="si_review",
            user_id="usr_test",
            topic_text="Review topic",
            is_starred=True,
        )
    )
    db.add(
        Question(
            id="q_review",
            user_id="usr_test",
            study_input_id="si_review",
            study_topic_id="tp_review",
            question_type="mcq",
            question_text="Which choice is correct?",
            choices_json=["A", "B", "C", "D"],
            answer_index=1,
            answer_text=None,
            explanation="Because B is correct.",
            source_hash="hash_review",
            created_at=datetime(2026, 4, 20, 12, 0, tzinfo=UTC),
        )
    )
    db.commit()

    response = test_client.post(
        "/v1/review/answer",
        json={
            "question_id": "q_review",
            "selected_index": 1,
            "response_time_ms": 1200,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["is_correct"] is True
    assert payload["current_streak"] == 1
