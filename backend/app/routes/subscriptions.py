from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import Subscription, PLAN_LIMITS
from app.schemas.subscription import PlanDetail, SubscriptionResponse, UpgradeRequest

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

PLANS: list[PlanDetail] = [
    PlanDetail(
        plan="WEEKLY", price_zar=49.0, period="week", peter_limit=5,
        features=["5 Peter AI setups/day", "Live chart", "Pending orders", "Wallet"],
        locked_features=["Multi-timeframe analysis", "AI risk sizing", "Pattern AI", "Backtesting"],
    ),
    PlanDetail(
        plan="MONTHLY", price_zar=149.0, period="month", peter_limit="unlimited",
        features=["Unlimited Peter AI", "Live chart", "Pending orders", "Wallet",
                  "Multi-timeframe analysis", "AI risk sizing"],
        locked_features=["Pattern recognition AI", "News sentiment", "Backtesting"],
    ),
    PlanDetail(
        plan="YEARLY", price_zar=999.0, period="year", peter_limit="unlimited",
        features=["Unlimited Peter AI", "Live chart", "Pending orders", "Wallet",
                  "Multi-timeframe analysis", "AI risk sizing",
                  "Pattern recognition AI", "News sentiment", "Backtesting", "Priority support"],
        locked_features=[],
    ),
]


@router.get("/plans", response_model=list[PlanDetail])
async def list_plans():
    return PLANS


@router.get("/me", response_model=SubscriptionResponse)
async def my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=current_user.id)
        db.add(sub)
        await db.flush()
    return SubscriptionResponse(
        plan=sub.plan,
        peter_uses_today=sub.peter_uses_today,
        peter_limit=sub.peter_limit,
        can_use_peter=sub.can_use_peter,
        expires_at=sub.expires_at,
    )


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade(
    req: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    valid_plans = {"WEEKLY", "MONTHLY", "YEARLY"}
    if req.plan not in valid_plans:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Plan must be one of {valid_plans}")

    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=current_user.id)
        db.add(sub)

    now = datetime.now(timezone.utc)
    expiry_map = {
        "WEEKLY":  timedelta(weeks=1),
        "MONTHLY": timedelta(days=30),
        "YEARLY":  timedelta(days=365),
    }
    sub.plan = req.plan
    sub.peter_limit = PLAN_LIMITS[req.plan]
    sub.started_at = now
    sub.expires_at = now + expiry_map[req.plan]
    sub.peter_uses_today = 0
    await db.flush()

    return SubscriptionResponse(
        plan=sub.plan,
        peter_uses_today=sub.peter_uses_today,
        peter_limit=sub.peter_limit,
        can_use_peter=sub.can_use_peter,
        expires_at=sub.expires_at,
    )