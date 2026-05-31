from datetime import UTC, datetime

from app.db.models.question import Question
from app.db.models.study import StudyInput, StudyTopic
from app.domain.review_answer_validation import INVALID_ANSWER_PAYLOAD


def _seed_mcq(db, *, question_id: str = "q_validate") -> None:
    db.add(
        StudyInput(
            id="si_validate",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for answer validation coverage.",
        )
    )
    db.add(
        StudyTopic(
            id="tp_validate",
            study_input_id="si_validate",
            user_id="usr_test",
            topic_text="Validation topic",
            is_starred=True,
        )
    )
    db.add(
        Question(
            id=question_id,
            user_id="usr_test",
            study_input_id="si_validate",
            study_topic_id="tp_validate",
            question_type="mcq",
            question_text="Which choice is correct?",
            choices_json=["A", "B", "C", "D"],
            answer_index=0,
            answer_text=None,
            explanation="Because A is correct.",
            source_hash=f"hash_{question_id}",
            created_at=datetime(2026, 4, 20, 12, 0, tzinfo=UTC),
        )
    )


def test_submit_answer_rejects_out_of_range_index(client) -> None:
    test_client, db = client
    _seed_mcq(db)
    db.commit()

    response = test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_validate", "selected_index": 9},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == INVALID_ANSWER_PAYLOAD


def test_submit_answer_rejects_missing_index_for_mcq(client) -> None:
    test_client, db = client
    _seed_mcq(db)
    db.commit()

    response = test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_validate", "selected_text": "A"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == INVALID_ANSWER_PAYLOAD


def test_submit_answer_accepts_valid_index(client) -> None:
    test_client, db = client
    _seed_mcq(db)
    db.commit()

    response = test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_validate", "selected_index": 0},
    )

    assert response.status_code == 200
    assert response.json()["is_correct"] is True


def test_submit_answer_rejects_legacy_fill_blank(client) -> None:
    test_client, db = client
    db.add(
        StudyInput(
            id="si_legacy",
            user_id="usr_test",
            input_type="notes",
            raw_content="Legacy fill blank note content for validation coverage.",
        )
    )
    db.add(
        StudyTopic(
            id="tp_legacy",
            study_input_id="si_legacy",
            user_id="usr_test",
            topic_text="Legacy topic",
            is_starred=True,
        )
    )
    db.add(
        Question(
            id="q_legacy_fill",
            user_id="usr_test",
            study_input_id="si_legacy",
            study_topic_id="tp_legacy",
            question_type="fill_blank",
            question_text="Fill in the blank.",
            choices_json=None,
            answer_index=None,
            answer_text="legacy",
            explanation="Legacy format.",
            source_hash="hash_legacy_fill",
            created_at=datetime(2026, 4, 20, 12, 0, tzinfo=UTC),
        )
    )
    db.commit()

    response = test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_legacy_fill", "selected_text": "legacy"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == INVALID_ANSWER_PAYLOAD
