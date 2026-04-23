from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta

import requests
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models.ops_alert import OpsAlert
from app.db.models.ops_event import OpsEvent
from app.utils.ids import make_id


@dataclass(frozen=True, slots=True)
class OpsDigest:
    window_start: datetime
    window_end: datetime
    window_minutes: int
    http_5xx: int
    http_429: int
    slow: int
    exception: int
    job_failed: int
    job_slow: int


class OpsAlertService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def compute_digest(self, *, now: datetime | None = None, window_minutes: int | None = None) -> OpsDigest:
        reference_now = now or datetime.now(UTC)
        minutes = int(window_minutes or self.settings.ops_alert_window_minutes)
        window_end = reference_now
        window_start = window_end - timedelta(minutes=minutes)

        http_5xx = int(
            self.db.scalar(
                select(func.count(OpsEvent.id)).where(
                    OpsEvent.created_at >= window_start,
                    OpsEvent.created_at < window_end,
                    OpsEvent.kind == "http",
                    OpsEvent.status_code >= 500,
                )
            )
            or 0
        )
        http_429 = int(
            self.db.scalar(
                select(func.count(OpsEvent.id)).where(
                    OpsEvent.created_at >= window_start,
                    OpsEvent.created_at < window_end,
                    OpsEvent.kind == "http",
                    OpsEvent.status_code == 429,
                )
            )
            or 0
        )
        slow = int(
            self.db.scalar(
                select(func.count(OpsEvent.id)).where(
                    OpsEvent.created_at >= window_start,
                    OpsEvent.created_at < window_end,
                    OpsEvent.kind == "http",
                    OpsEvent.detail == "slow",
                )
            )
            or 0
        )
        exception = int(
            self.db.scalar(
                select(func.count(OpsEvent.id)).where(
                    OpsEvent.created_at >= window_start,
                    OpsEvent.created_at < window_end,
                    OpsEvent.kind == "exception",
                )
            )
            or 0
        )
        job_failed = int(
            self.db.scalar(
                select(func.count(OpsEvent.id)).where(
                    OpsEvent.created_at >= window_start,
                    OpsEvent.created_at < window_end,
                    OpsEvent.kind == "job",
                    OpsEvent.detail == "failed",
                )
            )
            or 0
        )
        job_slow = int(
            self.db.scalar(
                select(func.count(OpsEvent.id)).where(
                    OpsEvent.created_at >= window_start,
                    OpsEvent.created_at < window_end,
                    OpsEvent.kind == "job",
                    OpsEvent.detail == "slow",
                )
            )
            or 0
        )

        return OpsDigest(
            window_start=window_start,
            window_end=window_end,
            window_minutes=minutes,
            http_5xx=http_5xx,
            http_429=http_429,
            slow=slow,
            exception=exception,
            job_failed=job_failed,
            job_slow=job_slow,
        )

    def should_alert(self, digest: OpsDigest) -> bool:
        return any(
            [
                digest.http_5xx >= int(self.settings.ops_alert_threshold_5xx),
                digest.http_429 >= int(self.settings.ops_alert_threshold_429),
                digest.slow >= int(self.settings.ops_alert_threshold_slow),
                digest.exception >= int(self.settings.ops_alert_threshold_exception),
                digest.job_failed >= int(self.settings.ops_alert_threshold_job_failed),
                digest.job_slow >= int(self.settings.ops_alert_threshold_job_slow),
            ]
        )

    def send_slack_alert_if_needed(self, *, now: datetime | None = None) -> dict:
        digest = self.compute_digest(now=now)
        if not self.should_alert(digest):
            return {"sent": False, "reason": "below_threshold", "digest": asdict(digest)}

        webhook = self.settings.ops_slack_webhook_url
        if not webhook:
            return {"sent": False, "reason": "missing_slack_webhook", "digest": asdict(digest)}

        # Bucket by minute so repeated runs for the same window collapse into one alert.
        window_start = digest.window_start.replace(second=0, microsecond=0)
        minutes = digest.window_minutes

        alert = self.db.scalar(
            select(OpsAlert).where(OpsAlert.window_start == window_start, OpsAlert.window_minutes == minutes)
        )
        if alert and int(alert.sent_ok) == 1:
            return {"sent": False, "reason": "already_sent", "digest": asdict(digest)}

        if not alert:
            alert = OpsAlert(
                id=make_id("opa"),
                created_at=datetime.now(UTC),
                window_start=window_start,
                window_minutes=minutes,
                sent_ok=0,
            )
            self.db.add(alert)
            try:
                self.db.commit()
            except IntegrityError:
                # Another worker inserted the same window; re-load and continue (allow retry if sent_ok=0).
                self.db.rollback()
                alert = self.db.scalar(
                    select(OpsAlert).where(OpsAlert.window_start == window_start, OpsAlert.window_minutes == minutes)
                )
                if alert and int(alert.sent_ok) == 1:
                    return {"sent": False, "reason": "already_sent", "digest": asdict(digest)}

        # Keep counts up to date even if we are retrying a failed Slack delivery.
        if alert:
            alert.http_5xx = digest.http_5xx
            alert.http_429 = digest.http_429
            alert.slow = digest.slow
            alert.exception = digest.exception
            alert.job_failed = digest.job_failed
            alert.job_slow = digest.job_slow
            self.db.commit()

        text = (
            f"*NightRecall Ops Alert* (last {minutes} min)\n"
            f"- 5xx: {digest.http_5xx}\n"
            f"- 429: {digest.http_429}\n"
            f"- slow(>=2s): {digest.slow}\n"
            f"- exceptions: {digest.exception}\n"
            f"- job failed: {digest.job_failed}\n"
            f"- job slow(>=20s): {digest.job_slow}\n"
            f"- window: {digest.window_start.isoformat()} -> {digest.window_end.isoformat()}"
        )

        try:
            response = requests.post(webhook, json={"text": text}, timeout=8)
            ok = 200 <= response.status_code < 300
        except Exception:
            ok = False

        if ok and alert:
            alert.sent_ok = 1
            self.db.commit()
            return {"sent": True, "reason": "ok", "digest": asdict(digest)}

        return {"sent": False, "reason": "slack_failed", "digest": asdict(digest)}
