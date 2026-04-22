from datetime import date, timedelta

from app.services.streak_service import StreakService


def test_current_streak_counts_backwards_from_today() -> None:
    today = date(2026, 4, 13)
    answer_dates = [today, today - timedelta(days=1), today - timedelta(days=2)]
    assert StreakService.current_streak(answer_dates, today=today) == 3


def test_current_streak_uses_yesterday_if_today_missing() -> None:
    today = date(2026, 4, 13)
    answer_dates = [today - timedelta(days=1), today - timedelta(days=2)]
    assert StreakService.current_streak(answer_dates, today=today) == 2
