from datetime import UTC, datetime

from app.db.models.question import Question, QuestionSchedule
from app.db.models.study import StudyInput, StudyTopic
from app.db.models.user import User
from app.domain.review_attempts import PRACTICE_ATTEMPT


def _seed_question(db, *, question_id: str = "q_review_kind") -> None:
    db.add(
        StudyInput(
            id="si_review_kind",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for attempt kind coverage.",
        )
    )
    db.add(
        StudyTopic(
            id="tp_review_kind",
            study_input_id="si_review_kind",
            user_id="usr_test",
            topic_text="Attempt kind topic",
            is_starred=True,
        )
    )
    db.add(
        Question(
            id=question_id,
            user_id="usr_test",
            study_input_id="si_review_kind",
            study_topic_id="tp_review_kind",
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


def test_submit_answer_stores_attempt_kind(client) -> None:
    test_client, db = client
    _seed_question(db)
    db.commit()

    response = test_client.post(
        "/v1/review/answer",
        json={
            "question_id": "q_review_kind",
            "selected_index": 0,
            "attempt_kind": "practice",
        },
    )

    assert response.status_code == 200
    from app.db.models.review import ReviewEvent

    event = db.query(ReviewEvent).filter(ReviewEvent.question_id == "q_review_kind").one()
    assert event.attempt_kind == PRACTICE_ATTEMPT


def test_stats_count_only_ritual_main_attempts(client) -> None:
    test_client, db = client
    _seed_question(db, question_id="q_main")
    for question_id, answer_index in (("q_retry", 1), ("q_practice", 2)):
        db.add(
            Question(
                id=question_id,
                user_id="usr_test",
                study_input_id="si_review_kind",
                study_topic_id="tp_review_kind",
                question_type="mcq",
                question_text=f"Question {question_id}",
                choices_json=["A", "B", "C", "D"],
                answer_index=answer_index,
                answer_text=None,
                explanation="Explanation",
                source_hash=f"hash_{question_id}",
            )
        )
    db.commit()

    test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_main", "selected_index": 0, "attempt_kind": "ritual_main"},
    )
    test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_retry", "selected_index": 0, "attempt_kind": "ritual_retry"},
    )
    test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_practice", "selected_index": 2, "attempt_kind": "practice"},
    )

    stats = test_client.get("/v1/stats").json()
    assert stats["total_answered"] == 1
    assert stats["correct_count"] == 1
    assert stats["accuracy"] == 1.0


def test_practice_submit_does_not_update_schedule(client) -> None:
    test_client, db = client
    _seed_question(db)
    db.add(
        QuestionSchedule(
            id="qs_review_kind",
            user_id="usr_test",
            question_id="q_review_kind",
            priority_type="normal",
            next_due_at=datetime(2026, 4, 20, 12, 0, tzinfo=UTC),
        )
    )
    db.commit()
    schedule = db.get(QuestionSchedule, "qs_review_kind")
    assert schedule is not None
    original_due = schedule.next_due_at

    response = test_client.post(
        "/v1/review/answer",
        json={"question_id": "q_review_kind", "selected_index": 0, "attempt_kind": "practice"},
    )

    assert response.status_code == 200
    db.refresh(schedule)
    assert schedule.next_due_at == original_due
