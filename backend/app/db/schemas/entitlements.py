from typing import Literal

from app.db.schemas.common import APIModel


PlanName = Literal["free", "plus"]


class EntitlementsResponse(APIModel):
    plan: PlanName
    billing_enabled: bool

