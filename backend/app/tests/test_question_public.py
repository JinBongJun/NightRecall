from app.db.schemas.questions import QuestionOutput, QuestionPublic
from app.services.question_mapper import to_public_output


def test_to_public_output_strips_answer_fields() -> None:
    draft = QuestionOutput(
        id="q_test",
        question_type="mcq",
        question_text="Which one?",
        choices=["A", "B", "C", "D"],
        answer_index=2,
        answer_text=None,
        explanation="Because C.",
    )

    public = to_public_output(draft)

    assert public.model_dump() == {
        "id": "q_test",
        "question_type": "mcq",
        "question_text": "Which one?",
        "choices": ["A", "B", "C", "D"],
        "resurface_reason": None,
    }


def test_question_public_rejects_invalid_choice_count() -> None:
    try:
        QuestionPublic(
            id="q_test",
            question_type="mcq",
            question_text="Bad choices",
            choices=["Only one"],
        )
    except ValueError:
        return
    raise AssertionError("expected invalid choices to fail validation")
