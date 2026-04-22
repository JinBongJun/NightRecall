from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.analytics_event import AnalyticsEvent


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_event(self, event: AnalyticsEvent) -> None:
        self.db.add(event)

    def count_events_for_user(self, user_id: str) -> int:
        return int(self.db.scalar(select(func.count(AnalyticsEvent.id)).where(AnalyticsEvent.user_id_nullable == user_id)) or 0)

    def count_events_for_user_since(self, user_id: str, since: datetime) -> int:
        return int(
            self.db.scalar(
                select(func.count(AnalyticsEvent.id)).where(
                    AnalyticsEvent.user_id_nullable == user_id,
                    AnalyticsEvent.created_at >= since,
                )
            )
            or 0
        )

    @staticmethod
    def utc_now() -> datetime:
        return datetime.now(UTC)

