from datetime import UTC, datetime, time

from sqlalchemy.orm import Session

from app.db.models.usage_event import UsageEvent
from app.db.models.user import User
from app.db.repositories.usage_repository import UsageRepository
from app.db.schemas.usage import UsageLimitInfo, UsageLimitsResponse
from app.utils.ids import make_id
from app.utils.time import as_utc, timezone_or_utc, utc_now

PHOTO_EXTRACTION_LIMIT_REACHED = "photo_extraction_limit_reached"
QUESTION_GENERATION_DAILY_LIMIT_REACHED = "question_generation_daily_limit_reached"
QUESTION_GENERATION_MONTHLY_LIMIT_REACHED = "question_generation_monthly_limit_reached"

PHOTO_EXTRACTION_DAILY_LIMIT = 3
QUESTION_GENERATION_DAILY_LIMIT = 3
QUESTION_GENERATION_MONTHLY_LIMIT = 30

PHOTO_EXTRACT_EVENT = "photo_extract"
# Free-plan policy:
# - photo_extract_daily counts photo extraction attempts.
# - question_generation_* counts actual questions generated, not request sessions.
QUESTION_GENERATION_EVENT = "question_generation"


class UsageLimitService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = UsageRepository(db)

    def assert_can_extract_photo(self, user: User, now: datetime | None = None) -> None:
        reference_now = now or utc_now()
        day_start_utc = self._local_day_start_utc(user.timezone, reference_now)
        daily_count = self.repository.count_events_for_user_since(user.id, PHOTO_EXTRACT_EVENT, day_start_utc)
        if daily_count >= PHOTO_EXTRACTION_DAILY_LIMIT:
            raise ValueError(PHOTO_EXTRACTION_LIMIT_REACHED)

    def assert_can_generate_questions(self, user: User, requested_count: int = 1, now: datetime | None = None) -> None:
        reference_now = now or utc_now()
        day_start_utc = self._local_day_start_utc(user.timezone, reference_now)
        month_start_utc = self._local_month_start_utc(user.timezone, reference_now)
        requested = max(1, requested_count)

        daily_count = self.repository.count_events_for_user_since(user.id, QUESTION_GENERATION_EVENT, day_start_utc)
        if daily_count + requested > QUESTION_GENERATION_DAILY_LIMIT:
            raise ValueError(QUESTION_GENERATION_DAILY_LIMIT_REACHED)

        monthly_count = self.repository.count_events_for_user_since(user.id, QUESTION_GENERATION_EVENT, month_start_utc)
        if monthly_count + requested > QUESTION_GENERATION_MONTHLY_LIMIT:
            raise ValueError(QUESTION_GENERATION_MONTHLY_LIMIT_REACHED)

    def record_photo_extract(self, user_id: str) -> None:
        self.repository.add_event(
            UsageEvent(
                id=make_id("ue"),
                user_id=user_id,
                event_type=PHOTO_EXTRACT_EVENT,
            )
        )

    def record_question_generation(self, user_id: str, count: int) -> None:
        for _ in range(max(0, count)):
            self.repository.add_event(
                UsageEvent(
                    id=make_id("ue"),
                    user_id=user_id,
                    event_type=QUESTION_GENERATION_EVENT,
                )
            )

    def get_limits(self, user: User, now: datetime | None = None) -> UsageLimitsResponse:
        reference_now = now or utc_now()
        day_start_utc = self._local_day_start_utc(user.timezone, reference_now)
        month_start_utc = self._local_month_start_utc(user.timezone, reference_now)

        photo_used = self.repository.count_events_for_user_since(user.id, PHOTO_EXTRACT_EVENT, day_start_utc)
        question_daily_used = self.repository.count_events_for_user_since(
            user.id, QUESTION_GENERATION_EVENT, day_start_utc
        )
        question_monthly_used = self.repository.count_events_for_user_since(
            user.id, QUESTION_GENERATION_EVENT, month_start_utc
        )

        return UsageLimitsResponse(
            photo_extract_daily=UsageLimitInfo(
                limit=PHOTO_EXTRACTION_DAILY_LIMIT,
                used=photo_used,
                remaining=max(0, PHOTO_EXTRACTION_DAILY_LIMIT - photo_used),
            ),
            question_generation_daily=UsageLimitInfo(
                limit=QUESTION_GENERATION_DAILY_LIMIT,
                used=question_daily_used,
                remaining=max(0, QUESTION_GENERATION_DAILY_LIMIT - question_daily_used),
            ),
            question_generation_monthly=UsageLimitInfo(
                limit=QUESTION_GENERATION_MONTHLY_LIMIT,
                used=question_monthly_used,
                remaining=max(0, QUESTION_GENERATION_MONTHLY_LIMIT - question_monthly_used),
            ),
        )

    @staticmethod
    def _local_day_start_utc(timezone_name: str | None, now: datetime) -> datetime:
        timezone = timezone_or_utc(timezone_name)
        local_now = as_utc(now).astimezone(timezone)
        local_start = datetime.combine(local_now.date(), time.min, tzinfo=timezone)
        return local_start.astimezone(UTC)

    @staticmethod
    def _local_month_start_utc(timezone_name: str | None, now: datetime) -> datetime:
        timezone = timezone_or_utc(timezone_name)
        local_now = as_utc(now).astimezone(timezone)
        local_start = datetime(local_now.year, local_now.month, 1, tzinfo=timezone)
        return local_start.astimezone(UTC)
