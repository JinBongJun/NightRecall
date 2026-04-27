from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.db.models.analytics_event import AnalyticsEvent
from app.db.models.auth import UserIdentity, UserSession
from app.db.models.ops_event import OpsEvent
from app.db.models.question import Question, QuestionSchedule
from app.db.models.question_job import QuestionGenerationJob
from app.db.models.review import ReviewEvent
from app.db.models.study import StudyInput, StudyTopic
from app.db.models.study_extract_job import StudyInputExtractJob
from app.db.models.usage_event import UsageEvent
from app.db.models.user import User
from app.services.source_image_storage_service import SourceImageStorageService


class AccountService:
    def __init__(self, db: Session, source_image_storage: SourceImageStorageService | None = None):
        self.db = db
        self.source_image_storage = source_image_storage or SourceImageStorageService()

    def delete_user_account(self, user: User) -> None:
        user_id = user.id
        source_image_refs = set(
            self.db.scalars(
                select(StudyInput.source_image_ref).where(
                    StudyInput.user_id == user_id,
                    StudyInput.source_image_ref.is_not(None),
                )
            ).all()
        )
        for source_image_ref in source_image_refs:
            self.source_image_storage.delete(source_image_ref)

        self.db.execute(delete(AnalyticsEvent).where(AnalyticsEvent.user_id_nullable == user_id))
        self.db.execute(update(OpsEvent).where(OpsEvent.user_id_nullable == user_id).values(user_id_nullable=None))
        self.db.execute(delete(UsageEvent).where(UsageEvent.user_id == user_id))
        self.db.execute(delete(QuestionGenerationJob).where(QuestionGenerationJob.user_id == user_id))
        self.db.execute(delete(StudyInputExtractJob).where(StudyInputExtractJob.user_id == user_id))
        self.db.execute(delete(ReviewEvent).where(ReviewEvent.user_id == user_id))
        self.db.execute(delete(QuestionSchedule).where(QuestionSchedule.user_id == user_id))
        self.db.execute(delete(Question).where(Question.user_id == user_id))
        self.db.execute(delete(StudyTopic).where(StudyTopic.user_id == user_id))
        self.db.execute(delete(StudyInput).where(StudyInput.user_id == user_id))
        self.db.execute(delete(UserSession).where(UserSession.user_id == user_id))
        self.db.execute(delete(UserIdentity).where(UserIdentity.user_id == user_id))
        self.db.execute(delete(User).where(User.id == user_id))
        self.db.commit()
