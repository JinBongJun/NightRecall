from app.db.models.question import Question
from app.db.schemas.questions import QuestionOutput, QuestionPublic


def to_public_output(draft: QuestionOutput) -> QuestionPublic:
    return QuestionPublic(
        id=draft.id,
        question_type=draft.question_type,
        question_text=draft.question_text,
        choices=draft.choices,
        resurface_reason=draft.resurface_reason,
    )


def to_public_model(question: Question, *, resurface_reason: str | None = None) -> QuestionPublic:
    return QuestionPublic(
        id=question.id,
        question_type=question.question_type,
        question_text=question.question_text,
        choices=question.choices_json,
        resurface_reason=resurface_reason,
    )


def to_public_outputs(drafts: list[QuestionOutput]) -> list[QuestionPublic]:
    return [to_public_output(draft) for draft in drafts]
