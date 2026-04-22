import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models.question import Question, QuestionSchedule
from app.db.models.review import ReviewEvent
from app.db.models.study import StudyInput, StudyTopic
from app.db.models.user import User
from app.db.repositories.question_repository import QuestionRepository
from app.db.repositories.review_repository import ReviewRepository
from app.db.repositories.study_repository import StudyRepository
from app.db.schemas.questions import QuestionGenerateResponse, QuestionOutput
from app.db.schemas.review import (
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    GenerateFromSavedInputResponse,
    ReviewQuestionResponse,
    SavedStudyInputDetailResponse,
    SavedStudyInputSummaryResponse,
    SavedStudyInputsResponse,
    SavedTopicSourceResponse,
    TonightTopicsResponse,
)
from app.db.schemas.study_inputs import TopicResponse
from app.services.question_service import QuestionService
from app.services.streak_service import StreakService
from app.utils.ids import make_id
from app.utils.time import local_date

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class ScheduleScoreContext:
    priority_type: str
    wrong_count: int
    next_due_at: datetime
    last_seen_at: datetime | None
    timezone: str | None


class ReviewService:
    def __init__(self, db: Session):
        self.db = db
        self.question_repository = QuestionRepository(db)
        self.review_repository = ReviewRepository(db)
        self.study_repository = StudyRepository(db)

    @staticmethod
    def score_schedule(context: ScheduleScoreContext, now: datetime) -> int:
        score = 10
        if context.priority_type == "starred":
            score += 60
        if context.wrong_count > 0:
            score += 30
        if context.next_due_at <= now:
            score += 10
        today_local = local_date(now, context.timezone)
        if context.last_seen_at and local_date(context.last_seen_at, context.timezone) == (today_local - timedelta(days=1)):
            score -= 50
        return score

    def get_tonight_question(self, user_id: str) -> ReviewQuestionResponse | None:
        now = datetime.now(UTC)
        user = self.db.get(User, user_id)
        timezone = user.timezone if user else "UTC"
        schedules = self.question_repository.get_due_schedules(user_id, now)
        if not schedules:
            total_schedule_count = int(
                self.db.scalar(
                    select(func.count(QuestionSchedule.id)).where(QuestionSchedule.user_id == user_id)
                )
                or 0
            )
            next_schedule = self.db.scalar(
                select(QuestionSchedule.next_due_at)
                .where(QuestionSchedule.user_id == user_id, QuestionSchedule.next_due_at > now)
                .order_by(QuestionSchedule.next_due_at.asc())
                .limit(1)
            )
            logger.info(
                "review.tonight no_due_question user_id=%s total_schedules=%s next_due_at=%s now=%s",
                user_id,
                total_schedule_count,
                next_schedule.isoformat() if next_schedule else None,
                now.isoformat(),
            )
            return None
        ranked = sorted(
            schedules,
            key=lambda schedule: self.score_schedule(
                ScheduleScoreContext(
                    priority_type=schedule.priority_type,
                    wrong_count=schedule.wrong_count,
                    next_due_at=schedule.next_due_at,
                    last_seen_at=schedule.last_seen_at,
                    timezone=timezone,
                ),
                now,
            ),
            reverse=True,
        )
        question = self.review_repository.get_question(ranked[0].question_id)
        if not question:
            logger.warning(
                "review.tonight missing_question_record user_id=%s due_schedule_count=%s selected_question_id=%s now=%s",
                user_id,
                len(schedules),
                ranked[0].question_id,
                now.isoformat(),
            )
            return None
        logger.info(
            "review.tonight selected_question user_id=%s due_schedule_count=%s question_id=%s priority_type=%s wrong_count=%s next_due_at=%s",
            user_id,
            len(schedules),
            question.id,
            ranked[0].priority_type,
            ranked[0].wrong_count,
            ranked[0].next_due_at.isoformat(),
        )
        return ReviewQuestionResponse(
            mode="auto",
            question=self._to_output(
                question,
                resurface_reason="missed_before" if ranked[0].wrong_count > 0 else None,
            ),
        )

    def get_pickable_topics(self, user_id: str) -> TonightTopicsResponse:
        topics = self.question_repository.get_topics_for_user(user_id=user_id, limit=5)
        return TonightTopicsResponse(topics=[TopicResponse.model_validate(topic) for topic in topics])

    def get_question_from_topic(self, user_id: str, topic_id: str) -> ReviewQuestionResponse | None:
        questions = self.question_repository.get_questions_for_topic_ids([topic_id])
        questions = [
            question
            for question in questions
            if question.user_id == user_id and question.question_type in ("mcq", "true_false")
        ]
        if not questions:
            return None
        questions.sort(key=lambda item: item.created_at, reverse=True)
        return ReviewQuestionResponse(mode="picked", question=self._to_output(questions[0]))

    def list_saved_inputs(self, user_id: str) -> SavedStudyInputsResponse:
        items: list[SavedStudyInputSummaryResponse] = []
        study_inputs = self.study_repository.get_inputs_for_user(user_id)
        topics_by_input = self.study_repository.get_topics_for_inputs([study_input.id for study_input in study_inputs])

        for study_input in study_inputs:
            topics = topics_by_input.get(study_input.id, [])
            starred_topics = [topic for topic in topics if topic.is_starred and topic.user_id == user_id]
            if not starred_topics:
                continue

            title = (
                (study_input.source_preview_text or "").strip()
                or next((topic.topic_text.strip() for topic in starred_topics if topic.topic_text.strip()), "")
                or self._raw_preview(study_input.raw_content)
                or "Saved learning"
            )
            preview = next(
                (
                    topic.topic_text.strip()
                    for topic in starred_topics
                    if topic.topic_text.strip() and topic.topic_text.strip() != title
                ),
                "",
            ) or self._raw_preview(study_input.raw_content)

            items.append(
                SavedStudyInputSummaryResponse(
                    study_input_id=study_input.id,
                    input_type=study_input.input_type,
                    source_kind=study_input.source_kind,
                    source_preview_text=study_input.source_preview_text,
                    source_image_data=study_input.source_image_data,
                    title=title,
                    preview=preview,
                    bookmarked_count=len(starred_topics),
                    topic_id=starred_topics[0].id,
                )
            )

        return SavedStudyInputsResponse(items=items)

    def get_saved_topic_source(self, user_id: str, topic_id: str) -> SavedTopicSourceResponse:
        topic = self.study_repository.get_topic(topic_id)
        if not topic or topic.user_id != user_id:
            raise ValueError("topic not found")

        study_input = self.study_repository.get_input(topic.study_input_id)
        if not study_input or study_input.user_id != user_id:
            raise ValueError("study input not found")

        topics = self.study_repository.get_topics_for_input(study_input.id)
        return SavedTopicSourceResponse(
            topic_id=topic.id,
            study_input_id=study_input.id,
            input_type=study_input.input_type,
            raw_content=study_input.raw_content,
            source_kind=study_input.source_kind,
            source_preview_text=study_input.source_preview_text,
            source_image_data=study_input.source_image_data,
            topics=[TopicResponse.model_validate(item) for item in topics],
        )

    def get_saved_input_detail(self, user_id: str, study_input_id: str) -> SavedStudyInputDetailResponse:
        study_input = self.study_repository.get_input(study_input_id)
        if not study_input or study_input.user_id != user_id:
            raise ValueError("study input not found")

        topics = self.study_repository.get_topics_for_input(study_input.id)
        return SavedStudyInputDetailResponse(
            study_input_id=study_input.id,
            input_type=study_input.input_type,
            raw_content=study_input.raw_content,
            source_kind=study_input.source_kind,
            source_preview_text=study_input.source_preview_text,
            source_image_data=study_input.source_image_data,
            topics=[TopicResponse.model_validate(item) for item in topics],
        )

    def generate_questions_from_saved_topic(
        self,
        user_id: str,
        topic_id: str,
        selected_topic_ids: list[str],
        count: int,
    ) -> QuestionGenerateResponse:
        return QuestionService(self.db).generate_questions_for_topics(user_id, topic_id, selected_topic_ids, count)

    def generate_questions_from_saved_input(
        self,
        user_id: str,
        study_input_id: str,
        selected_topic_ids: list[str],
        count: int,
    ) -> GenerateFromSavedInputResponse:
        generated = QuestionService(self.db).generate_questions_for_study_input(user_id, study_input_id, selected_topic_ids, count)
        return GenerateFromSavedInputResponse(questions=generated.questions)

    def delete_saved_input(self, user_id: str, study_input_id: str) -> None:
        study_input = self.db.scalar(select(StudyInput).where(StudyInput.id == study_input_id))
        if not study_input:
            raise ValueError("study input not found")
        if study_input.user_id != user_id:
            raise ValueError("study input does not belong to user")

        topics = self.study_repository.get_topics_for_input(study_input_id)
        topic_ids = [topic.id for topic in topics]
        questions = self.question_repository.get_questions_for_topic_ids(topic_ids) if topic_ids else []
        question_ids = [question.id for question in questions]

        if question_ids:
            self.db.execute(delete(ReviewEvent).where(ReviewEvent.question_id.in_(question_ids)))
            self.db.execute(delete(QuestionSchedule).where(QuestionSchedule.question_id.in_(question_ids)))
            self.db.execute(delete(Question).where(Question.id.in_(question_ids)))

        if topic_ids:
            self.db.execute(delete(StudyTopic).where(StudyTopic.id.in_(topic_ids)))
        self.db.execute(delete(StudyInput).where(StudyInput.id == study_input_id))
        self.db.commit()

    def delete_topic(self, user_id: str, topic_id: str) -> None:
        topic = self.db.scalar(select(StudyTopic).where(StudyTopic.id == topic_id))
        if not topic:
            raise ValueError("topic not found")
        if topic.user_id != user_id:
            raise ValueError("topic does not belong to user")

        questions = self.question_repository.get_questions_for_topic_ids([topic_id])
        question_ids = [question.id for question in questions]

        if question_ids:
            self.db.execute(delete(ReviewEvent).where(ReviewEvent.question_id.in_(question_ids)))
            self.db.execute(delete(QuestionSchedule).where(QuestionSchedule.question_id.in_(question_ids)))
            self.db.execute(delete(Question).where(Question.id.in_(question_ids)))

        study_input_id = topic.study_input_id
        self.db.execute(delete(StudyTopic).where(StudyTopic.id == topic_id))

        remaining_topic = self.db.scalar(select(StudyTopic.id).where(StudyTopic.study_input_id == study_input_id).limit(1))
        if not remaining_topic:
            self.db.execute(delete(StudyInput).where(StudyInput.id == study_input_id))

        self.db.commit()

    def submit_answer(self, user_id: str, payload: AnswerSubmitRequest) -> AnswerSubmitResponse:
        question = self.review_repository.get_question(payload.question_id)
        if not question:
            raise ValueError("question not found")
        if question.user_id != user_id:
            raise ValueError("question does not belong to user")

        is_correct = self._evaluate_answer(question.answer_index, question.answer_text, payload.selected_index, payload.selected_text)
        self.review_repository.add_event(
            ReviewEvent(
                id=make_id("rv"),
                user_id=user_id,
                question_id=question.id,
                selected_index=payload.selected_index,
                selected_text=payload.selected_text,
                is_correct=is_correct,
                response_time_ms=payload.response_time_ms,
            )
        )

        schedule = self.review_repository.get_schedule(question.id)
        if schedule:
            self._apply_resurfacing(schedule, is_correct)

        self.db.commit()
        user = self.db.get(User, user_id)
        timezone = user.timezone if user else "UTC"
        local_dates = self._review_dates_for_timezone(user_id, timezone)
        streak = StreakService.current_streak(local_dates, today=local_date(datetime.now(UTC), timezone))
        return AnswerSubmitResponse(
            is_correct=is_correct,
            correct_index=question.answer_index,
            correct_text=question.answer_text,
            explanation=question.explanation,
            current_streak=streak,
        )

    @staticmethod
    def _evaluate_answer(
        answer_index: int | None,
        answer_text: str | None,
        selected_index: int | None,
        selected_text: str | None,
    ) -> bool:
        if answer_index is not None and selected_index is not None:
            return selected_index == answer_index
        if answer_text and selected_text:
            return selected_text.strip().lower() == answer_text.strip().lower()
        return False

    @staticmethod
    def _apply_resurfacing(schedule: QuestionSchedule, is_correct: bool) -> None:
        now = datetime.now(UTC)
        schedule.last_seen_at = now
        schedule.last_result = "correct" if is_correct else "wrong"
        if is_correct:
            schedule.wrong_count = 0
            schedule.next_due_at = now + timedelta(days=7)
            return
        schedule.wrong_count += 1
        schedule.next_due_at = now + timedelta(days=1 if schedule.wrong_count >= 2 else 2)

    def _review_dates_for_timezone(self, user_id: str, timezone: str | None) -> list:
        seen_dates: set = set()
        local_dates: list = []
        for answered_at in self.review_repository.answer_timestamps_desc(user_id):
            normalized_date = local_date(answered_at, timezone)
            if normalized_date in seen_dates:
                continue
            seen_dates.add(normalized_date)
            local_dates.append(normalized_date)
        return local_dates

    @staticmethod
    def _to_output(question, resurface_reason: str | None = None) -> QuestionOutput:
        return QuestionOutput(
            id=question.id,
            question_type=question.question_type,
            question_text=question.question_text,
            choices=question.choices_json,
            answer_index=question.answer_index,
            answer_text=question.answer_text,
            explanation=question.explanation,
            resurface_reason=resurface_reason,
        )

    @staticmethod
    def _raw_preview(raw_content: str) -> str:
        try:
            parsed = json.loads(raw_content)
            if isinstance(parsed, list):
                first_text = next((item.strip() for item in parsed if isinstance(item, str) and item.strip()), "")
                if first_text:
                    return first_text[:120]
        except (TypeError, ValueError):
            pass

        lines = [line.strip() for line in raw_content.split("\n") if line.strip()]
        if lines:
            return lines[0][:120]
        return ""
