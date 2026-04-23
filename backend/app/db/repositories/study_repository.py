from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.study import StudyInput, StudyTopic


class StudyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_input(self, study_input: StudyInput) -> StudyInput:
        self.db.add(study_input)
        self.db.flush()
        return study_input

    def add_topics(self, topics: list[StudyTopic]) -> list[StudyTopic]:
        self.db.add_all(topics)
        self.db.flush()
        return topics

    def get_input(self, study_input_id: str) -> StudyInput | None:
        return self.db.scalar(select(StudyInput).where(StudyInput.id == study_input_id))

    def get_inputs_for_user(self, user_id: str, limit: int | None = None, offset: int | None = None) -> list[StudyInput]:
        stmt = select(StudyInput).where(StudyInput.user_id == user_id).order_by(StudyInput.created_at.desc())
        if limit is not None:
            stmt = stmt.limit(limit)
        if offset is not None:
            stmt = stmt.offset(offset)
        return list(self.db.scalars(stmt))

    def get_topic(self, topic_id: str) -> StudyTopic | None:
        return self.db.scalar(select(StudyTopic).where(StudyTopic.id == topic_id))

    def get_topics_for_input(self, study_input_id: str) -> list[StudyTopic]:
        stmt = select(StudyTopic).where(StudyTopic.study_input_id == study_input_id).order_by(StudyTopic.created_at.asc())
        return list(self.db.scalars(stmt))

    def get_topics_for_inputs(self, study_input_ids: list[str]) -> dict[str, list[StudyTopic]]:
        if not study_input_ids:
            return {}

        stmt = (
            select(StudyTopic)
            .where(StudyTopic.study_input_id.in_(study_input_ids))
            .order_by(StudyTopic.study_input_id.asc(), StudyTopic.created_at.asc())
        )
        grouped: dict[str, list[StudyTopic]] = {study_input_id: [] for study_input_id in study_input_ids}
        for topic in self.db.scalars(stmt):
            grouped.setdefault(topic.study_input_id, []).append(topic)
        return grouped
