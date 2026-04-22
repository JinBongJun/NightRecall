from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.services.rate_limit_service import RateLimitService


def rate_limit_ip(*, endpoint: str, limit: int, window_seconds: int):
    """
    Dependency for public endpoints.

    Uses a hashed IP key in the DB. X-Forwarded-For can be spoofed if the server
    is not behind a trusted proxy. For Railway/Vercel style deployments it's
    typically present; we use it as a best-effort signal.
    """

    def _dep(request: Request, db: Session = Depends(get_db)) -> None:
        decision = RateLimitService(db).check_ip_limit(
            request=request,
            endpoint=endpoint,
            limit=limit,
            window_seconds=window_seconds,
        )
        if decision.allowed:
            db.commit()
            return
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="rate_limited",
            headers={
                "Retry-After": str(decision.reset_in_seconds),
                "X-RateLimit-Limit": str(decision.limit),
                "X-RateLimit-Remaining": str(decision.remaining),
            },
        )

    return _dep


def rate_limit_user(*, endpoint: str, limit: int, window_seconds: int):
    """Dependency for authenticated endpoints (scoped by user id)."""

    def _dep(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> None:
        decision = RateLimitService(db).check_user_limit(
            user_id=current_user.id,
            endpoint=endpoint,
            limit=limit,
            window_seconds=window_seconds,
        )
        if decision.allowed:
            db.commit()
            return
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="rate_limited",
            headers={
                "Retry-After": str(decision.reset_in_seconds),
                "X-RateLimit-Limit": str(decision.limit),
                "X-RateLimit-Remaining": str(decision.remaining),
            },
        )

    return _dep

