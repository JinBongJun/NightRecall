from datetime import time

from pydantic import Field

from app.db.schemas.common import APIModel


class GuestUserCreateRequest(APIModel):
    timezone: str = Field(default="UTC", min_length=1, max_length=64)
    locale: str = Field(default="en", min_length=2, max_length=12)
    reminder_time: time | None = None


class UserResponse(APIModel):
    id: str
    auth_provider: str
    email_nullable: str | None
    timezone: str
    locale: str
    reminder_time: time | None
    notifications_enabled: bool
