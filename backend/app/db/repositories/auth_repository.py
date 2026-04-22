from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.auth import UserIdentity, UserSession


class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_identity(self, identity: UserIdentity) -> UserIdentity:
        self.db.add(identity)
        self.db.flush()
        return identity

    def get_identity(self, provider: str, provider_subject: str) -> UserIdentity | None:
        stmt = select(UserIdentity).where(
            UserIdentity.provider == provider,
            UserIdentity.provider_subject == provider_subject,
        )
        return self.db.scalar(stmt)

    def create_session(self, session: UserSession) -> UserSession:
        self.db.add(session)
        self.db.flush()
        return session

    def get_session(self, session_id: str) -> UserSession | None:
        return self.db.scalar(select(UserSession).where(UserSession.id == session_id))

    def revoke_session(self, session: UserSession) -> None:
        session.revoked_at = datetime.utcnow()

    def touch_session(self, session: UserSession) -> None:
        session.last_used_at = datetime.utcnow()
