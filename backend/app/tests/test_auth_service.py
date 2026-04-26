from datetime import time

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models.user import User
from app.db.schemas.auth import GuestSessionRequest
from app.services.auth_service import AuthService
from app.services.google_auth_service import GoogleIdentity


def make_db() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def test_create_guest_session_persists_reminder_defaults() -> None:
    db = make_db()
    service = AuthService(db)

    response = service.create_guest_session(
        GuestSessionRequest(
            timezone="Asia/Seoul",
            locale="ko",
            reminder_time=time(22, 30),
        )
    )

    stored_user = db.get(User, response.user.id)
    assert stored_user is not None
    assert stored_user.reminder_time == time(22, 30)
    assert stored_user.notifications_enabled is True


def test_sign_in_with_google_uses_client_timezone_for_new_user() -> None:
    db = make_db()
    service = AuthService(db)
    service.google_auth_service = type(
        "FakeGoogleAuthService",
        (),
        {
            "verify_id_token": staticmethod(
                lambda _: GoogleIdentity(
                    subject="google-subject-123",
                    email="test@example.com",
                    email_verified=True,
                    display_name="Test User",
                    avatar_url="https://example.com/avatar.jpg",
                )
            )
        },
    )()

    response = service.sign_in_with_google("fake-token", "Asia/Seoul", "ko")
    stored_user = db.get(User, response.user.id)

    assert stored_user is not None
    assert stored_user.timezone == "Asia/Seoul"
    assert stored_user.locale == "ko"
    assert stored_user.display_name == "Test User"
    assert stored_user.avatar_url == "https://example.com/avatar.jpg"
