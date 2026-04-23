import hashlib
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.db.models.question import Question, QuestionSchedule
from app.db.models.user import User
from app.db.repositories.question_repository import QuestionRepository
from app.db.repositories.study_repository import StudyRepository
from app.db.schemas.questions import QuestionGenerateRequest, QuestionGenerateResponse, QuestionOutput
from app.services.llm_service import LLMService
from app.services.usage_limit_service import UsageLimitService
from app.utils.ids import make_id


class QuestionService:
    def __init__(self, db: Session):
        self.db = db
        self.question_repository = QuestionRepository(db)
        self.study_repository = StudyRepository(db)

    def generate_questions(self, user_id: str, payload: QuestionGenerateRequest) -> QuestionGenerateResponse:
        study_input = self.study_repository.get_input(payload.study_input_id)
        if not study_input or study_input.user_id != user_id:
            raise ValueError("study_input_id not found for user")

        topics = self.study_repository.get_topics_for_input(payload.study_input_id)
        if not topics:
            raise ValueError("no topics found for study input")
        limit_service = self._assert_generation_capacity(user_id, payload.count)

        generated: list[Question] = []
        schedules: list[QuestionSchedule] = []
        outputs: list[QuestionOutput] = []

        for index in range(payload.count):
            topic = topics[index % len(topics)]
            raw = LLMService.generate_question(
                study_input_text=study_input.raw_content,
                topic=topic.topic_text,
                variant_seed=index,
                is_starred=topic.is_starred,
            )
            question = Question(
                id=make_id("q"),
                user_id=user_id,
                study_input_id=study_input.id,
                study_topic_id=topic.id,
                question_type=raw.question_type,
                question_text=raw.question_text,
                choices_json=raw.choices,
                answer_index=raw.answer_index,
                answer_text=raw.answer_text,
                explanation=raw.explanation,
                source_hash=hashlib.sha256(f"{study_input.id}:{topic.id}:{index}".encode()).hexdigest(),
            )
            generated.append(question)
            schedules.append(
                QuestionSchedule(
                    id=make_id("qs"),
                    user_id=user_id,
                    question_id=question.id,
                    priority_type="starred" if topic.is_starred else "normal",
                    next_due_at=datetime.now(UTC),
                )
            )
            outputs.append(
                QuestionOutput(
                    id=question.id,
                    question_type=question.question_type,
                    question_text=question.question_text,
                    choices=question.choices_json,
                    answer_index=question.answer_index,
                    answer_text=question.answer_text,
                    explanation=question.explanation,
                )
            )

        self.question_repository.add_questions(generated)
        self.question_repository.add_schedules(schedules)
        limit_service.record_question_generation(user_id, len(generated))
        self.db.commit()
        return QuestionGenerateResponse(questions=outputs)

    def generate_questions_for_topics(self, user_id: str, topic_id: str, selected_topic_ids: list[str], count: int) -> QuestionGenerateResponse:
        topic = self.study_repository.get_topic(topic_id)
        if not topic or topic.user_id != user_id:
            raise ValueError("topic not found for user")

        study_input = self.study_repository.get_input(topic.study_input_id)
        if not study_input or study_input.user_id != user_id:
            raise ValueError("study_input not found for user")

        available_topics = self.study_repository.get_topics_for_input(study_input.id)
        if not available_topics:
            raise ValueError("no topics found for study input")

        if selected_topic_ids:
            selected_topics = [item for item in available_topics if item.id in set(selected_topic_ids)]
        else:
            selected_topics = available_topics

        if not selected_topics:
            raise ValueError("no selected topics found for study input")
        limit_service = self._assert_generation_capacity(user_id, count)

        generated: list[Question] = []
        schedules: list[QuestionSchedule] = []
        outputs: list[QuestionOutput] = []

        for index in range(count):
            chosen_topic = selected_topics[index % len(selected_topics)]
            raw = LLMService.generate_question(
                study_input_text=study_input.raw_content,
                topic=chosen_topic.topic_text,
                variant_seed=index,
                is_starred=chosen_topic.is_starred,
            )
            question = Question(
                id=make_id("q"),
                user_id=user_id,
                study_input_id=study_input.id,
                study_topic_id=chosen_topic.id,
                question_type=raw.question_type,
                question_text=raw.question_text,
                choices_json=raw.choices,
                answer_index=raw.answer_index,
                answer_text=raw.answer_text,
                explanation=raw.explanation,
                source_hash=hashlib.sha256(f"{study_input.id}:{chosen_topic.id}:{index}:saved".encode()).hexdigest(),
            )
            generated.append(question)
            schedules.append(
                QuestionSchedule(
                    id=make_id("qs"),
                    user_id=user_id,
                    question_id=question.id,
                    priority_type="starred" if chosen_topic.is_starred else "normal",
                    next_due_at=datetime.now(UTC),
                )
            )
            outputs.append(
                QuestionOutput(
                    id=question.id,
                    question_type=question.question_type,
                    question_text=question.question_text,
                    choices=question.choices_json,
                    answer_index=question.answer_index,
                    answer_text=question.answer_text,
                    explanation=question.explanation,
                )
            )

        self.question_repository.add_questions(generated)
        self.question_repository.add_schedules(schedules)
        limit_service.record_question_generation(user_id, len(generated))
        self.db.commit()
        return QuestionGenerateResponse(questions=outputs)

    def generate_questions_for_study_input(self, user_id: str, study_input_id: str, selected_topic_ids: list[str], count: int) -> QuestionGenerateResponse:
        study_input = self.study_repository.get_input(study_input_id)
        if not study_input or study_input.user_id != user_id:
            raise ValueError("study_input_id not found for user")

        available_topics = self.study_repository.get_topics_for_input(study_input.id)
        if not available_topics:
            raise ValueError("no topics found for study input")

        if selected_topic_ids:
            selected_topics = [item for item in available_topics if item.id in set(selected_topic_ids)]
        else:
            selected_topics = [item for item in available_topics if item.is_starred]

        if not selected_topics:
            raise ValueError("no selected topics found for study input")
        limit_service = self._assert_generation_capacity(user_id, count)

        generated: list[Question] = []
        schedules: list[QuestionSchedule] = []
        outputs: list[QuestionOutput] = []

        for index in range(count):
            chosen_topic = selected_topics[index % len(selected_topics)]
            raw = LLMService.generate_question(
                study_input_text=study_input.raw_content,
                topic=chosen_topic.topic_text,
                variant_seed=index,
                is_starred=chosen_topic.is_starred,
            )
            question = Question(
                id=make_id("q"),
                user_id=user_id,
                study_input_id=study_input.id,
                study_topic_id=chosen_topic.id,
                question_type=raw.question_type,
                question_text=raw.question_text,
                choices_json=raw.choices,
                answer_index=raw.answer_index,
                answer_text=raw.answer_text,
                explanation=raw.explanation,
                source_hash=hashlib.sha256(f"{study_input.id}:{chosen_topic.id}:{index}:saved-input".encode()).hexdigest(),
            )
            generated.append(question)
            schedules.append(
                QuestionSchedule(
                    id=make_id("qs"),
                    user_id=user_id,
                    question_id=question.id,
                    priority_type="starred" if chosen_topic.is_starred else "normal",
                    next_due_at=datetime.now(UTC),
                )
            )
            outputs.append(
                QuestionOutput(
                    id=question.id,
                    question_type=question.question_type,
                    question_text=question.question_text,
                    choices=question.choices_json,
                    answer_index=question.answer_index,
                    answer_text=question.answer_text,
                    explanation=question.explanation,
                )
            )

        self.question_repository.add_questions(generated)
        self.question_repository.add_schedules(schedules)
        limit_service.record_question_generation(user_id, len(generated))
        self.db.commit()
        return QuestionGenerateResponse(questions=outputs)

    def _assert_generation_capacity(self, user_id: str, requested_count: int) -> UsageLimitService:
        user = self.db.get(User, user_id)
        if not user:
            raise ValueError("user not found")
        limit_service = UsageLimitService(self.db)
        limit_service.assert_can_generate_questions(user, requested_count=requested_count)
        return limit_service
