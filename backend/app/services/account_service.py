from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.models.auth import UserIdentity, UserSession
from app.db.models.question import Question, QuestionSchedule
from app.db.models.review import ReviewEvent
from app.db.models.study import StudyInput, StudyTopic
from app.db.models.user import User


class AccountService:
    def __init__(self, db: Session):
        self.db = db

    def delete_user_account(self, user: User) -> None:
        user_id = user.id
        self.db.execute(delete(ReviewEvent).where(ReviewEvent.user_id == user_id))
        self.db.execute(delete(QuestionSchedule).where(QuestionSchedule.user_id == user_id))
        self.db.execute(delete(Question).where(Question.user_id == user_id))
        self.db.execute(delete(StudyTopic).where(StudyTopic.user_id == user_id))
        self.db.execute(delete(StudyInput).where(StudyInput.user_id == user_id))
        self.db.execute(delete(UserSession).where(UserSession.user_id == user_id))
        self.db.execute(delete(UserIdentity).where(UserIdentity.user_id == user_id))
        self.db.execute(delete(User).where(User.id == user_id))
        self.db.commit()
