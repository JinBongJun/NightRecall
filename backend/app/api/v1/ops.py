from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from dataclasses import asdict
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_db
from app.core.config import get_settings
from app.services.ops_alert_service import OpsAlertService


router = APIRouter()


def require_ops_token(x_ops_token: str | None = Header(default=None)) -> None:
    settings = get_settings()
    expected = settings.ops_cron_token
    if not expected:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="ops_token_not_configured")
    if not x_ops_token or x_ops_token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")


@router.get("/digest")
def get_ops_digest(
    _: None = Depends(require_ops_token),
    db: Session = Depends(get_db),
):
    digest = OpsAlertService(db).compute_digest()
    return asdict(digest)


@router.post("/alert-run")
def run_ops_alerts(
    _: None = Depends(require_ops_token),
    db: Session = Depends(get_db),
):
    return OpsAlertService(db).send_slack_alert_if_needed()
