from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.waitlist import WaitlistSignup
from app.db.schemas.waitlist import WaitlistSignupCreateRequest, WaitlistSignupResponse
from app.utils.ids import make_id


class WaitlistService:
    def __init__(self, db: Session):
        self.db = db

    def upsert_signup(self, payload: WaitlistSignupCreateRequest) -> WaitlistSignupResponse:
        signup = self.db.scalar(select(WaitlistSignup).where(WaitlistSignup.email == payload.email))
        created_new = signup is None

        if signup is None:
            now = datetime.utcnow()
            signup = WaitlistSignup(
                id=make_id("wls"),
                email=payload.email,
                source_nullable=payload.source,
                signup_count=1,
                created_at=now,
                updated_at=now,
                last_signup_at=now,
            )
            self.db.add(signup)
        else:
            now = datetime.utcnow()
            # Basic spam/accidental-double-submit guard for a public endpoint.
            # This does not stop unique-email abuse, but it prevents hammering the same email.
            if signup.last_signup_at and (now - signup.last_signup_at) < timedelta(minutes=1):
                return WaitlistSignupResponse.model_validate(
                    {
                        **signup.__dict__,
                        "created_new": False,
                    }
                )
            signup.signup_count += 1
            signup.source_nullable = payload.source or signup.source_nullable
            signup.last_signup_at = now

        self.db.commit()
        self.db.refresh(signup)

        return WaitlistSignupResponse.model_validate(
            {
                **signup.__dict__,
                "created_new": created_new,
            }
        )
