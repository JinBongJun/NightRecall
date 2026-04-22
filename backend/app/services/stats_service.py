from datetime import date, datetime

from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.repositories.review_repository import ReviewRepository
from app.db.schemas.stats import StatsResponse
from app.services.streak_service import StreakService
from app.utils.time import local_date, local_month_start_utc, utc_now


class StatsService:
    def __init__(self, db: Session):
        self.repository = ReviewRepository(db)

    def get_stats(self, user: User, now: datetime | None = None) -> StatsResponse:
        total_answered = self.repository.count_answers(user.id)
        correct_count = self.repository.count_correct(user.id)
        reference_now = now or utc_now()
        today = local_date(reference_now, user.timezone)
        month_start_utc = local_month_start_utc(user.timezone, reference_now)
        local_dates: list[date] = []
        seen_dates: set[date] = set()
        for answered_at in self.repository.answer_timestamps_desc(user.id):
            normalized_date = local_date(answered_at, user.timezone)
            if normalized_date in seen_dates:
                continue
            seen_dates.add(normalized_date)
            local_dates.append(normalized_date)
        month_local_dates: list[date] = []
        month_seen_dates: set[date] = set()
        for answered_at in self.repository.answer_timestamps_since_desc(user.id, month_start_utc):
            normalized_date = local_date(answered_at, user.timezone)
            if normalized_date in month_seen_dates:
                continue
            month_seen_dates.add(normalized_date)
            month_local_dates.append(normalized_date)
        month_local_dates.sort()
        accuracy = round((correct_count / total_answered), 2) if total_answered else 0.0
        return StatsResponse(
            current_streak=StreakService.current_streak(local_dates, today=today),
            total_answered=total_answered,
            correct_count=correct_count,
            accuracy=accuracy,
            recent_wrong_topics=self.repository.recent_wrong_topics(user.id),
            answered_today=today in seen_dates,
            answered_dates_this_month=[value.isoformat() for value in month_local_dates],
        )
