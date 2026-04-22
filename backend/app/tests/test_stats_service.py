from datetime import UTC, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models.review import ReviewEvent
from app.db.models.user import User
from app.services.stats_service import StatsService


def make_db() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def test_get_stats_uses_user_timezone_for_local_day_boundaries() -> None:
    db = make_db()
    user = User(
        id="usr_stats",
        auth_provider="guest",
        timezone="Asia/Seoul",
        locale="ko",
    )
    db.add(user)
    db.add(
        ReviewEvent(
            id="rv_stats",
            user_id=user.id,
            question_id="q_stats",
            is_correct=True,
            response_time_ms=1200,
            answered_at=datetime(2026, 4, 20, 15, 30, tzinfo=UTC),
        )
    )
    db.commit()

    stats = StatsService(db).get_stats(user, now=datetime(2026, 4, 20, 16, 0, tzinfo=UTC))

    assert stats.answered_today is True
    assert stats.current_streak == 1
    assert stats.answered_dates_this_month == ["2026-04-21"]


def test_get_stats_returns_deduped_dates_for_current_local_month() -> None:
    db = make_db()
    user = User(
        id="usr_stats_month",
        auth_provider="guest",
        timezone="Asia/Seoul",
        locale="ko",
    )
    db.add(user)
    db.add_all(
        [
            ReviewEvent(
                id="rv_month_1",
                user_id=user.id,
                question_id="q_month_1",
                is_correct=True,
                response_time_ms=1000,
                answered_at=datetime(2026, 3, 31, 16, 30, tzinfo=UTC),
            ),
            ReviewEvent(
                id="rv_month_2",
                user_id=user.id,
                question_id="q_month_2",
                is_correct=False,
                response_time_ms=1000,
                answered_at=datetime(2026, 4, 1, 3, 0, tzinfo=UTC),
            ),
            ReviewEvent(
                id="rv_month_3",
                user_id=user.id,
                question_id="q_month_3",
                is_correct=True,
                response_time_ms=1000,
                answered_at=datetime(2026, 4, 20, 15, 30, tzinfo=UTC),
            ),
        ]
    )
    db.commit()

    stats = StatsService(db).get_stats(user, now=datetime(2026, 4, 20, 16, 0, tzinfo=UTC))

    assert stats.answered_dates_this_month == ["2026-04-01", "2026-04-21"]
