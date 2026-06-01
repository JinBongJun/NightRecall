from typing import Literal

from app.db.schemas.common import APIModel


class HealthResponse(APIModel):
    status: Literal["ok", "degraded"]
    database: Literal["ok", "unavailable"]
