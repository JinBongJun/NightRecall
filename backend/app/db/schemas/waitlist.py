from datetime import datetime

from pydantic import Field, field_validator

from app.db.schemas.common import APIModel


class WaitlistSignupCreateRequest(APIModel):
    email: str = Field(min_length=3, max_length=255)
    source: str | None = Field(default="landing-page", min_length=1, max_length=64)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized:
            raise ValueError("Valid email is required")
        return normalized

    @field_validator("source")
    @classmethod
    def normalize_source(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()


class WaitlistSignupResponse(APIModel):
    id: str
    email: str
    source_nullable: str | None
    signup_count: int
    created_at: datetime
    updated_at: datetime
    last_signup_at: datetime
    created_new: bool
