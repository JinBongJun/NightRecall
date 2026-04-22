from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.usage_event import UsageEvent


class UsageRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_event(self, usage_event: UsageEvent) -> UsageEvent:
        self.db.add(usage_event)
        self.db.flush()
        return usage_event

    def count_events_for_user_since(self, user_id: str, event_type: str, since: datetime) -> int:
        stmt = select(func.count(UsageEvent.id)).where(
            UsageEvent.user_id == user_id,
            UsageEvent.event_type == event_type,
            UsageEvent.created_at >= since,
        )
        return int(self.db.scalar(stmt) or 0)
