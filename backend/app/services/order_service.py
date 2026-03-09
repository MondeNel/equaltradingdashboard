from decimal import Decimal
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.order import PendingOrder
from app.schemas.order import PlaceOrderRequest
from app.services.wallet_service import reserve_margin, release_margin
from app.utils.pip_calc import calculate_margin


async def place_order(
    user_id: uuid.UUID,
    req: PlaceOrderRequest,
    db: AsyncSession,
) -> PendingOrder:
    margin = calculate_margin(req.lot_size, req.volume)

    # Reserve margin from wallet (raises 402 if insufficient)
    await reserve_margin(user_id, margin, db)

    order = PendingOrder(
        user_id=user_id,
        symbol=req.symbol,
        market=req.market,
        order_type=req.order_type,
        lot_size=req.lot_size,
        volume=req.volume,
        entry_price=req.entry_price,
        tp_price=req.tp_price,
        sl_price=req.sl_price,
        margin=margin,
    )
    db.add(order)
    await db.flush()
    return order


async def cancel_order(
    user_id: uuid.UUID,
    order_id: uuid.UUID,
    db: AsyncSession,
) -> PendingOrder:
    result = await db.execute(
        select(PendingOrder).where(
            PendingOrder.id == order_id,
            PendingOrder.user_id == user_id,
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending order not found",
        )

    # Return margin to wallet
    await release_margin(user_id, order.margin, Decimal("0"), db)
    await db.delete(order)
    await db.flush()
    return order


async def get_pending_orders(user_id: uuid.UUID, db: AsyncSession) -> list[PendingOrder]:
    result = await db.execute(
        select(PendingOrder)
        .where(PendingOrder.user_id == user_id)
        .order_by(PendingOrder.created_at.desc())
    )
    return list(result.scalars().all())