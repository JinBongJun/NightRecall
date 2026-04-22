from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.db.schemas.usage import UsageLimitsResponse
from app.services.usage_limit_service import UsageLimitService

router = APIRouter()


@router.get("/limits", response_model=UsageLimitsResponse)
def get_usage_limits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UsageLimitsResponse:
    return UsageLimitService(db).get_limits(current_user)

