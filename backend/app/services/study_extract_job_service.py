import logging
from datetime import UTC, datetime
from typing import cast

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.ops_event import OpsEvent
from app.db.models.study_extract_job import StudyInputExtractJob
from app.db.models.user import User
from app.db.schemas.study_inputs import (
    StudyInputExtractJobResponse,
    StudyInputExtractJobStatus,
    StudyInputExtractRequest,
    StudyInputExtractResponse,
)
from app.db.session import SessionLocal
from app.services.study_extract_service import StudyExtractService
from app.services.usage_limit_service import UsageLimitService
from app.utils.ids import make_id

logger = logging.getLogger(__name__)


class StudyInputExtractJobService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def create_job(
        self,
        user_id: str,
        payload: StudyInputExtractRequest,
        background_tasks: BackgroundTasks,
    ) -> StudyInputExtractJobResponse:
        user = self.db.get(User, user_id)
        if user is None:
            raise ValueError("user not found")

        if payload.source_type == "image":
            UsageLimitService(self.db).assert_can_extract_photo(user)

        job = StudyInputExtractJob(
            id=make_id("sej"),
            user_id=user_id,
            status="queued",
            request_json=payload.model_dump_json(),
        )
        self.db.add(job)
        self.db.commit()
        if self.settings.inline_job_processing_enabled:
            background_tasks.add_task(self.process_job, job.id)
        return self._to_response(job)

    def get_job(self, user_id: str, job_id: str) -> StudyInputExtractJobResponse:
        job = self._get_owned_job(user_id, job_id)
        return self._to_response(job)

    def process_job(self, job_id: str) -> None:
        db = SessionLocal()
        try:
            job = db.scalar(select(StudyInputExtractJob).where(StudyInputExtractJob.id == job_id))
            if not job:
                logger.warning("study_extract.job missing job_id=%s", job_id)
                return
            if job.status not in ("queued", "running"):
                return

            job.status = "running"
            job.started_at = datetime.now(UTC)
            db.commit()

            run_started_at = datetime.now(UTC)
            payload = StudyInputExtractRequest.model_validate_json(job.request_json)
            response = StudyExtractService().extract(payload)
            if payload.source_type == "image":
                UsageLimitService(db).record_photo_extract(job.user_id)
            duration_ms = int((datetime.now(UTC) - run_started_at).total_seconds() * 1000)

            job.status = "succeeded"
            job.result_json = response.model_dump_json()
            job.error_message = None
            job.completed_at = datetime.now(UTC)
            db.commit()
            self._record_job_event(db, kind="job", detail=None, duration_ms=duration_ms, user_id=job.user_id)
            if duration_ms >= 20_000:
                self._record_job_event(db, kind="job", detail="slow", duration_ms=duration_ms, user_id=job.user_id)
            logger.info(
                "study_extract.job succeeded job_id=%s user_id=%s points=%s",
                job.id,
                job.user_id,
                len(response.points),
            )
        except Exception as exc:
            logger.exception("study_extract.job failed job_id=%s", job_id)
            db.rollback()
            job = db.scalar(select(StudyInputExtractJob).where(StudyInputExtractJob.id == job_id))
            if job:
                job.status = "failed"
                job.error_message = str(exc)
                job.completed_at = datetime.now(UTC)
                db.commit()
                self._record_job_event(db, kind="job", detail="failed", duration_ms=None, user_id=job.user_id)
        finally:
            db.close()

    def _get_owned_job(self, user_id: str, job_id: str) -> StudyInputExtractJob:
        job = self.db.scalar(
            select(StudyInputExtractJob).where(
                StudyInputExtractJob.id == job_id,
                StudyInputExtractJob.user_id == user_id,
            )
        )
        if not job:
            raise ValueError("study input extract job not found")
        return job

    @staticmethod
    def _to_response(job: StudyInputExtractJob) -> StudyInputExtractJobResponse:
        source_preview = None
        points = None
        if job.status == "succeeded" and job.result_json:
            response = StudyInputExtractResponse.model_validate_json(job.result_json)
            source_preview = response.source_preview
            points = response.points
        return StudyInputExtractJobResponse(
            job_id=job.id,
            status=cast(StudyInputExtractJobStatus, job.status),
            source_preview=source_preview,
            points=points,
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
                    route="/jobs/study-input-extract",
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
