from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.db.schemas.settings import ReminderSettingsPatchRequest, ReminderSettingsResponse
from app.services.settings_service import SettingsService

router = APIRouter()


@router.patch("/reminder", response_model=ReminderSettingsResponse)
def patch_reminder_settings(
    payload: ReminderSettingsPatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReminderSettingsResponse:
    return SettingsService(db).patch_reminder_settings(current_user, payload)
