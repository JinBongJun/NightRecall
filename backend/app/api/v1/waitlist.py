from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_db
from app.api.v1.rate_limit import rate_limit_ip
from app.db.schemas.waitlist import WaitlistSignupCreateRequest, WaitlistSignupResponse
from app.services.waitlist_service import WaitlistService

router = APIRouter()


@router.post("/signups", response_model=WaitlistSignupResponse, status_code=status.HTTP_201_CREATED)
def create_waitlist_signup(
    payload: WaitlistSignupCreateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ip(endpoint="waitlist.signups", limit=5, window_seconds=60)),
) -> WaitlistSignupResponse:
    response = WaitlistService(db).upsert_signup(payload)
    return response
