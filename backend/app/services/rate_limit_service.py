from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.repositories.rate_limit_repository import RateLimitRepository
from app.utils.ids import make_id


@dataclass(frozen=True, slots=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    reset_in_seconds: int


class RateLimitService:
    """
    DB-backed rate limiter.

    This is intentionally simple and deterministic (bucketed counters) so we can
    later swap the backend implementation to Redis without changing route code.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repository = RateLimitRepository(db)
        self.settings = get_settings()

    def check_and_increment(self, *, key: str, limit: int, window_seconds: int, now: datetime | None = None) -> RateLimitDecision:
        reference_now = now or datetime.now(UTC)
        bucket_start = self._bucket_start(reference_now, window_seconds)
        reset_in = window_seconds - (int(reference_now.timestamp()) % window_seconds)
        key_hash = self._hash_key(key)
        bucket_id = make_id("rlb")
        count = self.repository.increment_bucket(
            bucket_id=bucket_id,
            key_hash=key_hash,
            bucket_start=bucket_start,
            window_seconds=window_seconds,
            now=reference_now,
        )
        remaining = max(0, limit - count)
        allowed = count <= limit
        return RateLimitDecision(allowed=allowed, limit=limit, remaining=remaining, reset_in_seconds=reset_in)

    def check_ip_limit(
        self,
        *,
        request: Request,
        endpoint: str,
        limit: int,
        window_seconds: int,
        now: datetime | None = None,
    ) -> RateLimitDecision:
        ip = self._client_ip(request)
        key = f"ip:{ip}:{request.method}:{endpoint}"
        return self.check_and_increment(key=key, limit=limit, window_seconds=window_seconds, now=now)

    def check_user_limit(
        self,
        *,
        user_id: str,
        endpoint: str,
        limit: int,
        window_seconds: int,
        now: datetime | None = None,
    ) -> RateLimitDecision:
        key = f"user:{user_id}:{endpoint}"
        return self.check_and_increment(key=key, limit=limit, window_seconds=window_seconds, now=now)

    def _hash_key(self, key: str) -> str:
        # Derive from JWT secret so we don't need yet another secret in beta.
        secret = (self.settings.jwt_secret_key or "change-me").encode("utf-8")
        return hashlib.sha256(secret + b":" + key.encode("utf-8")).hexdigest()

    @staticmethod
    def _bucket_start(now: datetime, window_seconds: int) -> datetime:
        epoch = int(now.timestamp())
        bucket_epoch = epoch - (epoch % window_seconds)
        return datetime.fromtimestamp(bucket_epoch, tz=UTC)

    @staticmethod
    def _client_ip(request: Request) -> str:
        # NOTE: X-Forwarded-For is only trustworthy behind a configured proxy/load balancer.
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            first = forwarded.split(",")[0].strip()
            if first:
                return first
        if request.client and request.client.host:
            return request.client.host
        return "unknown"

