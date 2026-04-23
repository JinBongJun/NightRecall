import logging
from datetime import UTC, datetime
from typing import cast

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.question_job import QuestionGenerationJob
from app.db.models.user import User
from app.db.schemas.questions import (
    QuestionGenerateRequest,
    QuestionGenerateResponse,
    QuestionGenerationJobStatus,
    QuestionGenerationJobResponse,
)
from app.db.session import SessionLocal
from app.services.question_service import QuestionService
from app.services.usage_limit_service import UsageLimitService
from app.utils.ids import make_id

logger = logging.getLogger(__name__)


class QuestionGenerationJobService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def create_job(
        self,
        user_id: str,
        payload: QuestionGenerateRequest,
        background_tasks: BackgroundTasks,
    ) -> QuestionGenerationJobResponse:
        user = self.db.get(User, user_id)
        if user is None:
            raise ValueError("user not found")

        usage_service = UsageLimitService(self.db)
        usage_service.assert_can_generate_questions(user, requested_count=payload.count)

        job = QuestionGenerationJob(
            id=make_id("qj"),
            user_id=user_id,
            status="queued",
            request_json=payload.model_dump_json(),
        )
        self.db.add(job)
        self.db.commit()
        if self.settings.inline_job_processing_enabled:
            background_tasks.add_task(self.process_job, job.id)
        return self._to_response(job)

    def get_job(self, user_id: str, job_id: str) -> QuestionGenerationJobResponse:
        job = self._get_owned_job(user_id, job_id)
        return self._to_response(job)

    def process_job(self, job_id: str) -> None:
        db = SessionLocal()
        try:
            job = db.scalar(select(QuestionGenerationJob).where(QuestionGenerationJob.id == job_id))
            if not job:
                logger.warning("question_generation.job missing job_id=%s", job_id)
                return
            if job.status not in ("queued", "running"):
                return

            job.status = "running"
            job.started_at = datetime.now(UTC)
            db.commit()

            payload = QuestionGenerateRequest.model_validate_json(job.request_json)
            response = QuestionService(db).generate_questions(job.user_id, payload)

            job.status = "succeeded"
            job.result_json = response.model_dump_json()
            job.error_message = None
            job.completed_at = datetime.now(UTC)
            db.commit()
            logger.info("question_generation.job succeeded job_id=%s user_id=%s count=%s", job.id, job.user_id, len(response.questions))
        except Exception as exc:
            logger.exception("question_generation.job failed job_id=%s", job_id)
            db.rollback()
            job = db.scalar(select(QuestionGenerationJob).where(QuestionGenerationJob.id == job_id))
            if job:
                job.status = "failed"
                job.error_message = str(exc)
                job.completed_at = datetime.now(UTC)
                db.commit()
        finally:
            db.close()

    def _get_owned_job(self, user_id: str, job_id: str) -> QuestionGenerationJob:
        job = self.db.scalar(
            select(QuestionGenerationJob).where(
                QuestionGenerationJob.id == job_id,
                QuestionGenerationJob.user_id == user_id,
            )
        )
        if not job:
            raise ValueError("question generation job not found")
        return job

    @staticmethod
    def _to_response(job: QuestionGenerationJob) -> QuestionGenerationJobResponse:
        questions = None
        if job.status == "succeeded" and job.result_json:
            response = QuestionGenerateResponse.model_validate_json(job.result_json)
            questions = response.questions
        return QuestionGenerationJobResponse(
            job_id=job.id,
            status=cast(QuestionGenerationJobStatus, job.status),
            questions=questions,
            error_message=job.error_message,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )
