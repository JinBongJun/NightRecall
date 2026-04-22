from sqlalchemy.orm import Session

from app.db.schemas.settings import ReminderSettingsPatchRequest, ReminderSettingsResponse


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def patch_reminder_settings(self, user, payload: ReminderSettingsPatchRequest) -> ReminderSettingsResponse:
        user.reminder_time = payload.reminder_time
        user.notifications_enabled = payload.notifications_enabled
        user.timezone = payload.timezone
        self.db.commit()
        self.db.refresh(user)
        return ReminderSettingsResponse(
            user_id=str(user.id),
            reminder_time=user.reminder_time,
            notifications_enabled=user.notifications_enabled,
            timezone=user.timezone,
        )
