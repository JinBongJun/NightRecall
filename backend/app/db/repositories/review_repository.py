from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.question import Question, QuestionSchedule
from app.db.models.review import ReviewEvent
from app.db.models.study import StudyTopic


class ReviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_event(self, event: ReviewEvent) -> ReviewEvent:
        self.db.add(event)
        self.db.flush()
        return event

    def get_schedule(self, question_id: str) -> QuestionSchedule | None:
        return self.db.scalar(select(QuestionSchedule).where(QuestionSchedule.question_id == question_id))

    def get_question(self, question_id: str) -> Question | None:
        return self.db.scalar(select(Question).where(Question.id == question_id))

    def count_answers(self, user_id: str) -> int:
        return int(self.db.scalar(select(func.count(ReviewEvent.id)).where(ReviewEvent.user_id == user_id)) or 0)

    def count_correct(self, user_id: str) -> int:
        stmt = select(func.count(ReviewEvent.id)).where(ReviewEvent.user_id == user_id, ReviewEvent.is_correct.is_(True))
        return int(self.db.scalar(stmt) or 0)

    def recent_wrong_topics(self, user_id: str, limit: int = 5) -> list[str]:
        stmt = (
            select(StudyTopic.topic_text)
            .join(Question, Question.study_topic_id == StudyTopic.id)
            .join(ReviewEvent, ReviewEvent.question_id == Question.id)
            .where(ReviewEvent.user_id == user_id, ReviewEvent.is_correct.is_(False))
            .order_by(ReviewEvent.answered_at.desc())
            .limit(limit)
        )
        return list(dict.fromkeys(self.db.scalars(stmt)))

    def answer_timestamps_desc(self, user_id: str) -> list[datetime]:
        stmt = (
            select(ReviewEvent.answered_at)
            .where(ReviewEvent.user_id == user_id)
            .order_by(ReviewEvent.answered_at.desc())
        )
        return list(self.db.scalars(stmt))

    def answer_timestamps_since_desc(self, user_id: str, since: datetime) -> list[datetime]:
        stmt = (
            select(ReviewEvent.answered_at)
            .where(ReviewEvent.user_id == user_id, ReviewEvent.answered_at >= since)
            .order_by(ReviewEvent.answered_at.desc())
        )
        return list(self.db.scalars(stmt))
