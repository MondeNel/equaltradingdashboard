from datetime import datetime
from pydantic import BaseModel


class PlanDetail(BaseModel):
    plan: str
    price_zar: float
    period: str
    peter_limit: int | str   # int or "unlimited"
    features: list[str]
    locked_features: list[str]


class UpgradeRequest(BaseModel):
    plan: str   # WEEKLY / MONTHLY / YEARLY


class SubscriptionResponse(BaseModel):
    plan: str
    peter_uses_today: int
    peter_limit: int    # -1 = unlimited
    can_use_peter: bool
    expires_at: datetime | None

    model_config = {"from_attributes": True}