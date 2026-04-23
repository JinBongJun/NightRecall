from __future__ import annotations

import argparse
import logging
import time
from dataclasses import dataclass

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models.question_job import QuestionGenerationJob
from app.db.models.study_extract_job import StudyInputExtractJob
from app.db.session import SessionLocal
from app.services.question_generation_job_service import QuestionGenerationJobService
from app.services.study_extract_job_service import StudyInputExtractJobService
from app.utils.time import utc_now

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class ClaimedJob:
    kind: str
    job_id: str


class JobWorker:
    def __init__(self, poll_interval_seconds: float | None = None):
        settings = get_settings()
        self.poll_interval_seconds = poll_interval_seconds or settings.job_worker_poll_interval_seconds

    def run_once(self) -> bool:
        claimed = self._claim_next_question_job() or self._claim_next_extract_job()
        if not claimed:
            return False

        logger.info("job_worker processing kind=%s job_id=%s", claimed.kind, claimed.job_id)
        if claimed.kind == "question":
            db = SessionLocal()
            try:
                QuestionGenerationJobService(db).process_job(claimed.job_id)
            finally:
                db.close()
        else:
            db = SessionLocal()
            try:
                StudyInputExtractJobService(db).process_job(claimed.job_id)
            finally:
                db.close()
        return True

    def run_forever(self) -> None:
        while True:
            if not self.run_once():
                time.sleep(self.poll_interval_seconds)

    def _claim_next_question_job(self) -> ClaimedJob | None:
        db = SessionLocal()
        try:
            job = db.scalar(
                select(QuestionGenerationJob)
                .where(QuestionGenerationJob.status == "queued")
                .order_by(QuestionGenerationJob.created_at.asc())
                .with_for_update(skip_locked=True)
                .limit(1)
            )
            if not job:
                return None
            job.status = "running"
            job.started_at = utc_now()
            db.commit()
            return ClaimedJob(kind="question", job_id=job.id)
        finally:
            db.close()

    def _claim_next_extract_job(self) -> ClaimedJob | None:
        db = SessionLocal()
        try:
            job = db.scalar(
                select(StudyInputExtractJob)
                .where(StudyInputExtractJob.status == "queued")
                .order_by(StudyInputExtractJob.created_at.asc())
                .with_for_update(skip_locked=True)
                .limit(1)
            )
            if not job:
                return None
            job.status = "running"
            job.started_at = utc_now()
            db.commit()
            return ClaimedJob(kind="extract", job_id=job.id)
        finally:
            db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="NightRecall background job worker")
    parser.add_argument("--once", action="store_true", help="Process a single job and exit")
    parser.add_argument("--poll-interval", type=float, default=None, help="Idle poll interval in seconds")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    worker = JobWorker(poll_interval_seconds=args.poll_interval)
    if args.once:
        raise SystemExit(0 if worker.run_once() else 1)
    worker.run_forever()


if __name__ == "__main__":
    main()
