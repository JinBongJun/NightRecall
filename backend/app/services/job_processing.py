from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.question_job import QuestionGenerationJob
from app.db.models.study_extract_job import StudyInputExtractJob
from app.utils.time import as_utc, utc_now


def stale_running_cutoff(stale_after_seconds: int | None = None):
    seconds = stale_after_seconds if stale_after_seconds is not None else get_settings().job_stale_running_seconds
    return utc_now() - timedelta(seconds=seconds)


def is_stale_running(started_at, stale_after_seconds: int | None = None) -> bool:
    if started_at is None:
        return True
    return as_utc(started_at) <= stale_running_cutoff(stale_after_seconds)


def try_begin_question_generation_job(db: Session, job_id: str, *, stale_after_seconds: int | None = None) -> bool:
    now = utc_now()
    claimed = db.execute(
        update(QuestionGenerationJob)
        .where(
            QuestionGenerationJob.id == job_id,
            QuestionGenerationJob.status == "queued",
        )
        .values(status="running", started_at=now, updated_at=now)
    )
    if claimed.rowcount:
        db.commit()
        return True

    job = db.get(QuestionGenerationJob, job_id)
    if job and job.status == "running" and is_stale_running(job.started_at, stale_after_seconds):
        job.started_at = now
        job.updated_at = now
        db.commit()
        return True

    db.rollback()
    return False


def try_begin_study_extract_job(db: Session, job_id: str, *, stale_after_seconds: int | None = None) -> bool:
    now = utc_now()
    claimed = db.execute(
        update(StudyInputExtractJob)
        .where(
            StudyInputExtractJob.id == job_id,
            StudyInputExtractJob.status == "queued",
        )
        .values(status="running", started_at=now, updated_at=now)
    )
    if claimed.rowcount:
        db.commit()
        return True

    job = db.get(StudyInputExtractJob, job_id)
    if job and job.status == "running" and is_stale_running(job.started_at, stale_after_seconds):
        job.started_at = now
        job.updated_at = now
        db.commit()
        return True

    db.rollback()
    return False


def requeue_stuck_jobs(db: Session, *, stale_after_seconds: int | None = None) -> int:
    cutoff = stale_running_cutoff(stale_after_seconds)
    recovered = 0

    question_jobs = db.scalars(
        select(QuestionGenerationJob).where(
            QuestionGenerationJob.status == "running",
            QuestionGenerationJob.started_at.is_not(None),
            QuestionGenerationJob.started_at <= cutoff,
        )
    ).all()
    for job in question_jobs:
        job.status = "queued"
        job.started_at = None
        job.updated_at = utc_now()
        recovered += 1

    extract_jobs = db.scalars(
        select(StudyInputExtractJob).where(
            StudyInputExtractJob.status == "running",
            StudyInputExtractJob.started_at.is_not(None),
            StudyInputExtractJob.started_at <= cutoff,
        )
    ).all()
    for job in extract_jobs:
        job.status = "queued"
        job.started_at = None
        job.updated_at = utc_now()
        recovered += 1

    if recovered:
        db.commit()
    return recovered
