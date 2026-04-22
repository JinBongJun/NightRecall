from datetime import time

from pydantic import Field

from app.db.schemas.common import APIModel
from app.db.schemas.users import UserResponse


class GoogleSignInRequest(APIModel):
    id_token: str = Field(min_length=20)
    timezone: str = Field(default="UTC", min_length=1, max_length=64)
    locale: str = Field(default="en", min_length=2, max_length=12)
    device_label: str | None = Field(default=None, max_length=255)


class GuestSessionRequest(APIModel):
    timezone: str = Field(default="UTC", min_length=1, max_length=64)
    locale: str = Field(default="en", min_length=2, max_length=12)
    reminder_time: time | None = None
    device_label: str | None = Field(default=None, max_length=255)


class TokenPair(APIModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthSessionResponse(APIModel):
    user: UserResponse
    tokens: TokenPair
    is_new_user: bool = False


class RefreshTokenRequest(APIModel):
    refresh_token: str = Field(min_length=20)


class LinkGoogleRequest(APIModel):
    id_token: str = Field(min_length=20)


class LogoutRequest(APIModel):
    refresh_token: str = Field(min_length=20)
