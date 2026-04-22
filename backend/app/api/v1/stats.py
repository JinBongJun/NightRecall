from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.db.schemas.stats import StatsResponse
from app.services.stats_service import StatsService

router = APIRouter()


@router.get("", response_model=StatsResponse)
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> StatsResponse:
    return StatsService(db).get_stats(current_user)
