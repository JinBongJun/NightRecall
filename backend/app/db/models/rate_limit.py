from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RateLimitBucket(Base):
    """
    Generic rate limit bucket counter.

    We store a hashed key instead of raw identifiers (IP, user_id, etc.) to
    reduce the risk of leaking sensitive data through DB dumps.
    """

    __tablename__ = "rate_limit_buckets"
    __table_args__ = (
        UniqueConstraint("key_hash", "bucket_start", "window_seconds", name="uq_rate_limit_bucket"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    key_hash: Mapped[str] = mapped_column(String(64), index=True)
    bucket_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    window_seconds: Mapped[int] = mapped_column(Integer)
    count: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

