from __future__ import annotations

import hashlib
import secrets

from app.core.config import get_settings


def make_request_id() -> str:
    return secrets.token_hex(16)


def hash_identifier(value: str) -> str:
    """
    Hashes an identifier (e.g. IP) with a server-side secret salt.

    This is not meant for cryptographic authentication; it reduces the chance of
    leaking raw identifiers in DB dumps while keeping stable grouping.
    """

    settings = get_settings()
    salt = (settings.jwt_secret_key or "change-me").encode("utf-8")
    return hashlib.sha256(salt + b":" + value.encode("utf-8")).hexdigest()

