from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.schemas.users import GuestUserCreateRequest, UserResponse
from app.utils.ids import make_id


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def create_guest_user(self, payload: GuestUserCreateRequest) -> UserResponse:
        user = User(
            id=make_id("usr"),
            auth_provider="guest",
            timezone=payload.timezone,
            locale=payload.locale,
            reminder_time=payload.reminder_time,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return UserResponse.model_validate(user)

    def get_user(self, user_id: str) -> UserResponse | None:
        user = self.db.get(User, user_id)
        return UserResponse.model_validate(user) if user else None
