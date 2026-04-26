from dataclasses import dataclass

from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token

from app.core.config import get_settings


@dataclass(slots=True)
class GoogleIdentity:
    subject: str
    email: str | None
    email_verified: bool
    display_name: str | None = None
    avatar_url: str | None = None


class GoogleAuthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def verify_id_token(self, raw_id_token: str) -> GoogleIdentity:
        if not self.settings.enable_google_auth:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google auth is disabled")

        audiences = [
            client_id
            for client_id in [
                self.settings.google_web_client_id,
                self.settings.google_android_client_id,
                self.settings.google_ios_client_id,
            ]
            if client_id
        ]
        if not audiences:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google client IDs are not configured",
            )

        last_error: Exception | None = None
        for audience in audiences:
            try:
                payload = id_token.verify_oauth2_token(raw_id_token, requests.Request(), audience)
                return GoogleIdentity(
                    subject=str(payload["sub"]),
                    email=payload.get("email"),
                    email_verified=bool(payload.get("email_verified", False)),
                    display_name=payload.get("name"),
                    avatar_url=payload.get("picture"),
                )
            except Exception as exc:  # pragma: no cover - network/provider validation path
                last_error = exc
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google ID token") from last_error
