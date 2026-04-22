from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.db.models.rate_limit import RateLimitBucket


class RateLimitRepository:
    def __init__(self, db: Session):
        self.db = db

    def increment_bucket(
        self,
        *,
        bucket_id: str,
        key_hash: str,
        bucket_start: datetime,
        window_seconds: int,
        now: datetime | None = None,
    ) -> int:
        """
        Atomically increments the bucket counter and returns the new count.

        Works on Postgres and SQLite (used for local development/tests).
        """

        reference_now = now or datetime.now(UTC)

        values = {
            "id": bucket_id,
            "key_hash": key_hash,
            "bucket_start": bucket_start,
            "window_seconds": window_seconds,
            "count": 1,
            "created_at": reference_now,
            "updated_at": reference_now,
        }

        dialect = self.db.bind.dialect.name if self.db.bind is not None else ""

        if dialect == "postgresql":
            stmt = pg_insert(RateLimitBucket).values(**values)
            stmt = stmt.on_conflict_do_update(
                index_elements=["key_hash", "bucket_start", "window_seconds"],
                set_={
                    "count": RateLimitBucket.count + 1,
                    "updated_at": reference_now,
                },
            ).returning(RateLimitBucket.count)
            return int(self.db.execute(stmt).scalar_one())

        if dialect == "sqlite":
            stmt = sqlite_insert(RateLimitBucket).values(**values)
            stmt = stmt.on_conflict_do_update(
                index_elements=["key_hash", "bucket_start", "window_seconds"],
                set_={
                    "count": RateLimitBucket.count + 1,
                    "updated_at": reference_now,
                },
            )
            self.db.execute(stmt)
            self.db.flush()
            count = self.db.scalar(
                select(RateLimitBucket.count).where(
                    RateLimitBucket.key_hash == key_hash,
                    RateLimitBucket.bucket_start == bucket_start,
                    RateLimitBucket.window_seconds == window_seconds,
                )
            )
            return int(count or 0)

        # Fallback path: read-modify-write with a row lock-like pattern.
        bucket = self.db.scalar(
            select(RateLimitBucket).where(
                RateLimitBucket.key_hash == key_hash,
                RateLimitBucket.bucket_start == bucket_start,
                RateLimitBucket.window_seconds == window_seconds,
            )
        )
        if bucket is None:
            bucket = RateLimitBucket(**values)
            self.db.add(bucket)
            self.db.flush()
            return 1
        bucket.count += 1
        bucket.updated_at = reference_now
        self.db.flush()
        return int(bucket.count)

