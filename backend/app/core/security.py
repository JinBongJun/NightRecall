from datetime import UTC, datetime, timedelta
import hashlib
import hmac
from typing import Any

import jwt
from fastapi import HTTPException, status

from app.core.config import get_settings


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_ttl_minutes)
    return jwt.encode({"sub": subject, "type": "access", "exp": expires_at}, settings.jwt_secret_key, algorithm="HS256")


def create_refresh_token(subject: str, session_id: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_ttl_days)
    return jwt.encode(
        {"sub": subject, "sid": session_id, "type": "refresh", "exp": expires_at},
        settings.jwt_secret_key,
        algorithm="HS256",
    )


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    return payload


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_token_hash(raw_token: str, hashed_token: str) -> bool:
    return hmac.compare_digest(hash_token(raw_token), hashed_token)
