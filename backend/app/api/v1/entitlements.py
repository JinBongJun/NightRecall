from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.db.schemas.entitlements import EntitlementsResponse

router = APIRouter()


@router.get("", response_model=EntitlementsResponse)
def get_entitlements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EntitlementsResponse:
    # Payments are not wired yet. Keep this as the stable contract that will later
    # map to Google Play / App Store subscription status.
    _ = (current_user, db)
    return EntitlementsResponse(plan="free", billing_enabled=False)

