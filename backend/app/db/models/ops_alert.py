from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OpsAlert(Base):
    __tablename__ = "ops_alerts"
    __table_args__ = (
        UniqueConstraint("window_start", "window_minutes", name="uq_ops_alert_window"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    # Use tz-aware UTC timestamps to match DateTime(timezone=True).
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    window_minutes: Mapped[int] = mapped_column(Integer)

    http_5xx: Mapped[int] = mapped_column(Integer, default=0)
    http_429: Mapped[int] = mapped_column(Integer, default=0)
    slow: Mapped[int] = mapped_column(Integer, default=0)
    exception: Mapped[int] = mapped_column(Integer, default=0)

    sent_ok: Mapped[int] = mapped_column(Integer, default=0)
