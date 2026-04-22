from datetime import time

from pydantic import Field

from app.db.schemas.common import APIModel


class ReminderSettingsPatchRequest(APIModel):
    reminder_time: time
    notifications_enabled: bool = Field(default=True)
    timezone: str = Field(min_length=1, max_length=64)


class ReminderSettingsResponse(APIModel):
    user_id: str
    reminder_time: time
    notifications_enabled: bool
    timezone: str
