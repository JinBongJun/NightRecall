import json

from sqlalchemy.orm import Session

from app.db.models.study import StudyInput, StudyTopic
from app.db.repositories.study_repository import StudyRepository
from app.db.schemas.study_inputs import StudyInputCreateRequest, StudyInputCreateResponse, TopicResponse
from app.services.topic_service import TopicService
from app.utils.ids import make_id


class StudyInputService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = StudyRepository(db)

    def create_study_input(self, user_id: str, payload: StudyInputCreateRequest) -> StudyInputCreateResponse:
        study_input = StudyInput(
            id=make_id("si"),
            user_id=user_id,
            input_type=payload.input_type,
            raw_content=json.dumps(payload.content, ensure_ascii=False) if isinstance(payload.content, list) else payload.content,
            source_kind=payload.source_kind,
            source_preview_text=payload.source_preview_text,
            source_image_data=payload.source_image_data,
        )
        self.repository.create_input(study_input)

        raw_topics = payload.content if payload.input_type == "keywords" else TopicService.extract_topics_from_note(payload.content)
        topics = [
            StudyTopic(
                id=make_id("tp"),
                study_input_id=study_input.id,
                user_id=user_id,
                topic_text=topic,
                is_starred=index in payload.starred_indices,
            )
            for index, topic in enumerate(raw_topics)
        ]
        self.repository.add_topics(topics)
        self.db.commit()
        return StudyInputCreateResponse(
            study_input_id=study_input.id,
            topics=[TopicResponse.model_validate(topic) for topic in topics],
            source_kind=study_input.source_kind,
            source_preview_text=study_input.source_preview_text,
            source_image_data=study_input.source_image_data,
        )

    def redact_study_input_source(self, user_id: str, study_input_id: str) -> None:
        study_input = self.repository.get_input(study_input_id)
        if not study_input or study_input.user_id != user_id:
            raise ValueError("study input not found")

        study_input.raw_content = "[source removed after question generation]"
        study_input.source_kind = None
        study_input.source_preview_text = None
        study_input.source_image_data = None

        topics = self.repository.get_topics_for_input(study_input_id)
        for index, topic in enumerate(topics, start=1):
            topic.topic_text = f"Review point {index}"
            topic.is_starred = False

        self.db.commit()
