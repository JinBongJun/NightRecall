from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.db.models.analytics_event import AnalyticsEvent
from app.db.repositories.analytics_repository import AnalyticsRepository
from app.utils.ids import make_id


MAX_PROPS_JSON_LENGTH = 2000


class AnalyticsService:
    """
    Lightweight, DB-backed analytics/event logger.

    Rules:
    - Never store user content (study input text, extracted points, topic text).
    - Only store small, safe metadata (counts, booleans, numeric timings).
    - Never break the user request if analytics fails.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repository = AnalyticsRepository(db)

    def record(
        self,
        *,
        name: str,
        user_id: str | None,
        request_id: str | None,
        props: dict[str, Any] | None = None,
    ) -> None:
        payload = None
        if props:
            try:
                # Ensure we only persist JSON-serializable, small metadata.
                payload = json.dumps(props, ensure_ascii=True, separators=(",", ":"))
            except Exception:
                payload = None

        if payload and len(payload) > MAX_PROPS_JSON_LENGTH:
            payload = None

        try:
            self.repository.add_event(
                AnalyticsEvent(
                    id=make_id("ae"),
                    created_at=datetime.now(UTC),
                    user_id_nullable=user_id,
                    request_id=request_id,
                    name=name,
                    props_json=payload,
                )
            )
            self.db.commit()
        except Exception:
            self.db.rollback()

