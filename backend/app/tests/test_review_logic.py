from datetime import UTC, datetime, timedelta

from app.services.review_service import ReviewService, ScheduleScoreContext


def test_score_schedule_prioritizes_starred_and_wrong_items() -> None:
    now = datetime.now(UTC)
    starred_wrong = ScheduleScoreContext("starred", 1, now - timedelta(hours=1), None, "UTC")
    normal = ScheduleScoreContext("normal", 0, now - timedelta(hours=1), None, "UTC")
    assert ReviewService.score_schedule(starred_wrong, now) > ReviewService.score_schedule(normal, now)


def test_score_schedule_penalizes_yesterday_repeat() -> None:
    now = datetime.now(UTC)
    repeated = ScheduleScoreContext("starred", 0, now, now - timedelta(days=1), "UTC")
    fresh = ScheduleScoreContext("starred", 0, now, now - timedelta(days=3), "UTC")
    assert ReviewService.score_schedule(fresh, now) > ReviewService.score_schedule(repeated, now)


def test_score_schedule_uses_user_timezone_for_yesterday_penalty() -> None:
    now = datetime(2026, 4, 20, 0, 30, tzinfo=UTC)
    last_seen = datetime(2026, 4, 19, 23, 30, tzinfo=UTC)
    seoul_same_day = ScheduleScoreContext("starred", 0, now, last_seen, "Asia/Seoul")
    utc_yesterday = ScheduleScoreContext("starred", 0, now, last_seen, "UTC")

    assert ReviewService.score_schedule(seoul_same_day, now) > ReviewService.score_schedule(utc_yesterday, now)
