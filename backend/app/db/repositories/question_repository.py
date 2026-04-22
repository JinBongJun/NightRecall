from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.question import Question, QuestionSchedule
from app.db.models.study import StudyTopic


class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_questions(self, questions: list[Question]) -> list[Question]:
        self.db.add_all(questions)
        self.db.flush()
        return questions

    def add_schedules(self, schedules: list[QuestionSchedule]) -> list[QuestionSchedule]:
        self.db.add_all(schedules)
        self.db.flush()
        return schedules

    def get_question(self, question_id: str) -> Question | None:
        return self.db.scalar(select(Question).where(Question.id == question_id))

    def get_due_schedules(self, user_id: str, now: datetime) -> list[QuestionSchedule]:
        stmt = (
            select(QuestionSchedule)
            .join(Question, Question.id == QuestionSchedule.question_id)
            .where(QuestionSchedule.user_id == user_id, QuestionSchedule.next_due_at <= now)
            .where(Question.question_type.in_(("mcq", "true_false")))
            .order_by(QuestionSchedule.updated_at.asc())
        )
        return list(self.db.scalars(stmt))

    def get_questions_for_topic_ids(self, topic_ids: list[str]) -> list[Question]:
        if not topic_ids:
            return []
        stmt = select(Question).where(Question.study_topic_id.in_(topic_ids))
        return list(self.db.scalars(stmt))

    def get_topics_for_user(self, user_id: str, limit: int = 5) -> list[StudyTopic]:
        stmt = (
            select(StudyTopic)
            .where(StudyTopic.user_id == user_id)
            .order_by(StudyTopic.is_starred.desc(), StudyTopic.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))
