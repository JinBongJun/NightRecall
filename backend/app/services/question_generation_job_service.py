import logging
from datetime import UTC, datetime
from typing import cast

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.ops_event import OpsEvent
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

            run_started_at = datetime.now(UTC)
            payload = QuestionGenerateRequest.model_validate_json(job.request_json)
            response = QuestionService(db).generate_questions(job.user_id, payload)
            duration_ms = int((datetime.now(UTC) - run_started_at).total_seconds() * 1000)

            job.status = "succeeded"
            job.result_json = response.model_dump_json()
            job.error_message = None
            job.completed_at = datetime.now(UTC)
            db.commit()
            self._record_job_event(db, kind="job", detail=None, duration_ms=duration_ms, user_id=job.user_id)
            if duration_ms >= 20_000:
                self._record_job_event(db, kind="job", detail="slow", duration_ms=duration_ms, user_id=job.user_id)
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
                self._record_job_event(db, kind="job", detail="failed", duration_ms=None, user_id=job.user_id)
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

    def _record_job_event(self, db: Session, *, kind: str, detail: str | None, duration_ms: int | None, user_id: str) -> None:
        try:
            db.add(
                OpsEvent(
                    id=make_id("ops"),
                    created_at=datetime.now(UTC),
                    request_id=None,
                    route="/jobs/question-generation",
                    method="JOB",
                    status_code=None,
                    duration_ms=duration_ms,
                    user_id_nullable=user_id,
                    ip_hash_nullable=None,
                    kind=kind,
                    detail=detail,
                )
            )
            db.commit()
        except Exception:
            db.rollback()
