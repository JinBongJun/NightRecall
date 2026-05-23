from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.question_job import QuestionGenerationJob
from app.db.models.study_extract_job import StudyInputExtractJob
from app.db.schemas.questions import QuestionGenerateRequest
from app.db.schemas.study_inputs import StudyInputExtractRequest


class JobQuotaService:
    ACTIVE_JOB_STATUSES = ("queued", "running")

    def __init__(self, db: Session):
        self.db = db

    def pending_question_generation_count(self, user_id: str) -> int:
        jobs = self.db.scalars(
            select(QuestionGenerationJob).where(
                QuestionGenerationJob.user_id == user_id,
                QuestionGenerationJob.status.in_(self.ACTIVE_JOB_STATUSES),
            )
        ).all()
        total = 0
        for job in jobs:
            payload = QuestionGenerateRequest.model_validate_json(job.request_json)
            total += max(1, payload.count)
        return total

    def pending_photo_extract_count(self, user_id: str) -> int:
        jobs = self.db.scalars(
            select(StudyInputExtractJob).where(
                StudyInputExtractJob.user_id == user_id,
                StudyInputExtractJob.status.in_(self.ACTIVE_JOB_STATUSES),
            )
        ).all()
        total = 0
        for job in jobs:
            payload = StudyInputExtractRequest.model_validate_json(job.request_json)
            if payload.source_type == "image":
                total += 1
        return total
