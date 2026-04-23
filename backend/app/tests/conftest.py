from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.dependencies import get_current_user, get_db
from app.db.base import Base
from app.db.models import (
    Question,
    QuestionGenerationJob,
    QuestionSchedule,
    ReviewEvent,
    StudyInput,
    StudyTopic,
    UsageEvent,
    User,
    UserIdentity,
    UserSession,
)
from app.main import create_app


@pytest.fixture
def client() -> Generator[tuple[TestClient, Session], None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    user = User(
        id="usr_test",
        auth_provider="guest",
        timezone="UTC",
        locale="en",
    )
    db.add(user)
    db.commit()

    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass

    def override_get_current_user() -> User:
        return db.get(User, "usr_test")

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client, db

    app.dependency_overrides.clear()
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def unauthorized_client() -> Generator[TestClient, None, None]:
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
