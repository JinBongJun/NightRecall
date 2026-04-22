from datetime import date, timedelta


class StreakService:
    @staticmethod
    def current_streak(answer_dates: list[date], today: date | None = None) -> int:
        if not answer_dates:
            return 0

        today = today or date.today()
        available = set(answer_dates)
        streak = 0
        cursor = today

        if cursor not in available and (cursor - timedelta(days=1)) not in available:
            return 0
        if cursor not in available:
            cursor -= timedelta(days=1)

        while cursor in available:
            streak += 1
            cursor -= timedelta(days=1)
        return streak
