from datetime import UTC, datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models.question_job import QuestionGenerationJob
from app.db.models.study import StudyInput, StudyTopic
from app.db.models.user import User
from app.db.schemas.questions import QuestionGenerateRequest
from app.services.job_processing import requeue_stuck_jobs, try_begin_question_generation_job
from app.utils.ids import make_id


def make_db() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def seed_question_job(db: Session, *, user_id: str, count: int, status: str = "queued") -> QuestionGenerationJob:
    db.add(
        StudyInput(
            id="si_job_quota",
            user_id=user_id,
            input_type="notes",
            raw_content="This is a sufficiently long note for queued job quota coverage.",
            source_kind="manual",
        )
    )
    db.add(
        StudyTopic(
            id="tp_job_quota",
            study_input_id="si_job_quota",
            user_id=user_id,
            topic_text="Wheel lock detail",
            is_starred=True,
        )
    )
    job = QuestionGenerationJob(
        id=make_id("qj"),
        user_id=user_id,
        status=status,
        request_json=QuestionGenerateRequest(study_input_id="si_job_quota", count=count).model_dump_json(),
    )
    db.add(job)
    db.commit()
    return job


def test_requeue_stuck_jobs_recovers_stale_running_job() -> None:
    db = make_db()
    user = User(id="usr_job", auth_provider="guest", timezone="UTC", locale="en")
    db.add(user)
    db.commit()

    job = seed_question_job(db, user_id=user.id, count=1, status="running")
    job.started_at = datetime.now(UTC) - timedelta(minutes=30)
    db.commit()

    recovered = requeue_stuck_jobs(db, stale_after_seconds=600)

    assert recovered == 1
    db.refresh(job)
    assert job.status == "queued"
    assert job.started_at is None


def test_try_begin_question_generation_job_skips_active_running_job() -> None:
    db = make_db()
    user = User(id="usr_job", auth_provider="guest", timezone="UTC", locale="en")
    db.add(user)
    db.commit()

    job = seed_question_job(db, user_id=user.id, count=1, status="running")
    job.started_at = datetime.now(UTC)
    db.commit()

    assert try_begin_question_generation_job(db, job.id) is False


def test_pending_question_jobs_count_toward_daily_limit(client, monkeypatch) -> None:
    test_client, db = client

    monkeypatch.setattr(
        "app.services.question_generation_job_service.get_settings",
        lambda: type("Settings", (), {"inline_job_processing_enabled": False})(),
    )

    db.add(
        StudyInput(
            id="si_limit_jobs",
            user_id="usr_test",
            input_type="notes",
            raw_content="This is a sufficiently long note for queued job limit coverage.",
            source_kind="manual",
        )
    )
    db.add(
        StudyTopic(
            id="tp_limit_jobs",
            study_input_id="si_limit_jobs",
            user_id="usr_test",
            topic_text="Wheel lock detail",
            is_starred=True,
        )
    )
    db.commit()

    payload = {"study_input_id": "si_limit_jobs", "count": 1}
    for _ in range(3):
        response = test_client.post("/v1/questions/jobs", json=payload)
        assert response.status_code == 202

    limited = test_client.post("/v1/questions/jobs", json=payload)
    assert limited.status_code == 422
    assert limited.json()["detail"] == "question_generation_daily_limit_reached"
