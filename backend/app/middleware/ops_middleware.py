from __future__ import annotations

from datetime import UTC, datetime
import time

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.models.ops_event import OpsEvent
from app.db.session import SessionLocal
from app.utils.ids import make_id
from app.utils.observability import hash_identifier, make_request_id


SLOW_REQUEST_MS = 2000


def _route_template(request: Request) -> str:
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    if isinstance(path, str) and path:
        return path
    return request.url.path


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _user_id_from_bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth:
        return None
    parts = auth.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    if payload.get("type") != "access":
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


async def ops_middleware(request: Request, call_next):
    request_id = make_request_id()
    request.state.request_id = request_id
    start = time.perf_counter()
    user_id = _user_id_from_bearer(request)
    ip_hash = hash_identifier(_client_ip(request))

    try:
        response = await call_next(request)
        status_code = getattr(response, "status_code", None)
    except Exception as exc:
        duration_ms = int((time.perf_counter() - start) * 1000)
        _record_ops_event(
            kind="exception",
            request=request,
            request_id=request_id,
            user_id=user_id,
            ip_hash=ip_hash,
            status_code=500,
            duration_ms=duration_ms,
            detail=exc.__class__.__name__,
        )
        raise

    duration_ms = int((time.perf_counter() - start) * 1000)
    response.headers["X-Request-Id"] = request_id

    should_record = False
    if isinstance(status_code, int) and status_code >= 500:
        should_record = True
    if status_code == 429:
        should_record = True
    if duration_ms >= SLOW_REQUEST_MS:
        should_record = True

    if should_record:
        _record_ops_event(
            kind="http",
            request=request,
            request_id=request_id,
            user_id=user_id,
            ip_hash=ip_hash,
            status_code=int(status_code) if isinstance(status_code, int) else None,
            duration_ms=duration_ms,
            detail="slow" if duration_ms >= SLOW_REQUEST_MS else None,
        )

    return response


def _record_ops_event(
    *,
    kind: str,
    request: Request,
    request_id: str,
    user_id: str | None,
    ip_hash: str,
    status_code: int | None,
    duration_ms: int | None,
    detail: str | None,
) -> None:
    db: Session = SessionLocal()
    try:
        db.add(
            OpsEvent(
                id=make_id("ops"),
                created_at=datetime.now(UTC),
                request_id=request_id,
                route=_route_template(request),
                method=request.method,
                status_code=status_code,
                duration_ms=duration_ms,
                user_id_nullable=user_id,
                ip_hash_nullable=ip_hash,
                kind=kind,
                detail=detail,
            )
        )
        db.commit()
    except Exception:
        # Never break the user request because observability failed.
        db.rollback()
    finally:
        db.close()

