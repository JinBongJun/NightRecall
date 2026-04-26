from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_token, verify_token_hash
from app.db.models.auth import UserIdentity, UserSession
from app.db.models.user import User
from app.db.repositories.auth_repository import AuthRepository
from app.db.schemas.auth import AuthSessionResponse, GuestSessionRequest, LinkGoogleRequest, RefreshTokenRequest, TokenPair
from app.db.schemas.users import UserResponse
from app.services.google_auth_service import GoogleAuthService, GoogleIdentity
from app.utils.ids import make_id


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.auth_repository = AuthRepository(db)
        self.google_auth_service = GoogleAuthService()

    def create_guest_session(self, payload: GuestSessionRequest) -> AuthSessionResponse:
        user = User(
            id=make_id("usr"),
            auth_provider="guest",
            timezone=payload.timezone,
            locale=payload.locale,
            reminder_time=payload.reminder_time,
            notifications_enabled=payload.reminder_time is not None,
        )
        self.db.add(user)
        self.db.flush()

        self.auth_repository.create_identity(
            UserIdentity(
                id=make_id("idn"),
                user_id=user.id,
                provider="guest",
                provider_subject=user.id,
                email_nullable=None,
                email_verified=False,
            )
        )

        tokens = self._create_session_tokens(user.id, payload.device_label)
        self.db.commit()
        self.db.refresh(user)
        return AuthSessionResponse(user=UserResponse.model_validate(user), tokens=tokens, is_new_user=True)

    def sign_in_with_google(
        self,
        raw_id_token: str,
        timezone: str,
        locale: str,
        device_label: str | None = None,
    ) -> AuthSessionResponse:
        identity = self.google_auth_service.verify_id_token(raw_id_token)
        record = self.auth_repository.get_identity("google", identity.subject)
        is_new_user = False

        if record:
            user = self.db.get(User, record.user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Identity is orphaned")
            record.last_login_at = datetime.utcnow()
            self._apply_google_profile(user, identity)
        else:
            user = User(
                id=make_id("usr"),
                auth_provider="google",
                email_nullable=identity.email,
                display_name=identity.display_name,
                avatar_url=identity.avatar_url,
                timezone=timezone,
                locale=locale,
            )
            self.db.add(user)
            self.db.flush()
            self.auth_repository.create_identity(
                UserIdentity(
                    id=make_id("idn"),
                    user_id=user.id,
                    provider="google",
                    provider_subject=identity.subject,
                    email_nullable=identity.email,
                    email_verified=identity.email_verified,
                )
            )
            is_new_user = True

        tokens = self._create_session_tokens(user.id, device_label)
        self.db.commit()
        self.db.refresh(user)
        return AuthSessionResponse(user=UserResponse.model_validate(user), tokens=tokens, is_new_user=is_new_user)

    def link_google_identity(self, current_user: User, payload: LinkGoogleRequest) -> AuthSessionResponse:
        identity = self.google_auth_service.verify_id_token(payload.id_token)
        existing = self.auth_repository.get_identity("google", identity.subject)
        if existing and existing.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Google account is already linked")

        if not existing:
            self.auth_repository.create_identity(
                UserIdentity(
                    id=make_id("idn"),
                    user_id=current_user.id,
                    provider="google",
                    provider_subject=identity.subject,
                    email_nullable=identity.email,
                    email_verified=identity.email_verified,
                )
            )
        current_user.auth_provider = "google"
        self._apply_google_profile(current_user, identity)

        tokens = self._create_session_tokens(current_user.id, None)
        self.db.commit()
        self.db.refresh(current_user)
        return AuthSessionResponse(user=UserResponse.model_validate(current_user), tokens=tokens, is_new_user=False)

    def refresh_session(self, payload: RefreshTokenRequest) -> TokenPair:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        session = self.auth_repository.get_session(str(token_payload.get("sid")))
        if not session or session.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is not active")
        if session.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
        if not verify_token_hash(payload.refresh_token, session.refresh_token_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token mismatch")

        self.auth_repository.revoke_session(session)
        tokens = self._create_session_tokens(str(token_payload["sub"]), session.device_label_nullable)
        self.db.commit()
        return tokens

    def logout(self, refresh_token: str) -> None:
        token_payload = decode_token(refresh_token)
        if token_payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        session = self.auth_repository.get_session(str(token_payload.get("sid")))
        if not session:
            return
        self.auth_repository.revoke_session(session)
        self.db.commit()

    def get_me(self, current_user: User) -> UserResponse:
        return UserResponse.model_validate(current_user)

    def _apply_google_profile(self, user: User, identity: GoogleIdentity) -> None:
        if identity.email:
            user.email_nullable = identity.email
        if identity.display_name:
            user.display_name = identity.display_name
        if identity.avatar_url:
            user.avatar_url = identity.avatar_url

    def _create_session_tokens(self, user_id: str, device_label: str | None) -> TokenPair:
        session_id = make_id("ses")
        provisional_refresh = create_refresh_token(user_id, session_id)
        self.auth_repository.create_session(
            UserSession(
                id=session_id,
                user_id=user_id,
                refresh_token_hash=hash_token(provisional_refresh),
                device_label_nullable=device_label,
                expires_at=datetime.now(UTC) + timedelta(days=self.settings.jwt_refresh_token_ttl_days),
            )
        )
        access_token = create_access_token(user_id)
        return TokenPair(access_token=access_token, refresh_token=provisional_refresh)
