from __future__ import annotations

import argparse
import logging
import time
from dataclasses import dataclass

from sqlalchemy import select

from app.core.config import get_settings
from app.db import session as db_session
from app.db.models.question_job import QuestionGenerationJob
from app.db.models.study_extract_job import StudyInputExtractJob
from app.services.job_processing import requeue_stuck_jobs
from app.services.question_generation_job_service import QuestionGenerationJobService
from app.services.study_extract_job_service import StudyInputExtractJobService

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class ClaimedJob:
    kind: str
    job_id: str


class JobWorker:
    def __init__(self, poll_interval_seconds: float | None = None):
        settings = get_settings()
        self.poll_interval_seconds = poll_interval_seconds or settings.job_worker_poll_interval_seconds
        self._idle_polls = 0

    def run_once(self) -> bool:
        self._maybe_recover_stuck_jobs()
        claimed = self._next_question_job() or self._next_extract_job()
        if not claimed:
            return False

        logger.info("job_worker processing kind=%s job_id=%s", claimed.kind, claimed.job_id)
        if claimed.kind == "question":
            db = db_session.SessionLocal()
            try:
                QuestionGenerationJobService(db).process_job(claimed.job_id)
            finally:
                db.close()
        else:
            db = db_session.SessionLocal()
            try:
                StudyInputExtractJobService(db).process_job(claimed.job_id)
            finally:
                db.close()
        return True

    def run_forever(self) -> None:
        while True:
            if not self.run_once():
                time.sleep(self.poll_interval_seconds)

    def _maybe_recover_stuck_jobs(self) -> None:
        self._idle_polls += 1
        if self._idle_polls % 5 != 0:
            return
        db = db_session.SessionLocal()
        try:
            recovered = requeue_stuck_jobs(db)
            if recovered:
                logger.warning("job_worker requeued stuck jobs count=%s", recovered)
        finally:
            db.close()

    def _next_question_job(self) -> ClaimedJob | None:
        db = db_session.SessionLocal()
        try:
            job_id = db.scalar(
                select(QuestionGenerationJob.id)
                .where(QuestionGenerationJob.status == "queued")
                .order_by(QuestionGenerationJob.created_at.asc())
                .limit(1)
            )
            if not job_id:
                return None
            return ClaimedJob(kind="question", job_id=job_id)
        finally:
            db.close()

    def _next_extract_job(self) -> ClaimedJob | None:
        db = db_session.SessionLocal()
        try:
            job_id = db.scalar(
                select(StudyInputExtractJob.id)
                .where(StudyInputExtractJob.status == "queued")
                .order_by(StudyInputExtractJob.created_at.asc())
                .limit(1)
            )
            if not job_id:
                return None
            return ClaimedJob(kind="extract", job_id=job_id)
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
