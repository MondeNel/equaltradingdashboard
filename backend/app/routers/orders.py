import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.order import PlaceOrderRequest, OrderResponse
from app.services.order_service import cancel_order, get_pending_orders, place_order

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/place", response_model=OrderResponse, status_code=201)
async def place(
    req: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await place_order(current_user.id, req, db)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/pending")
async def list_pending(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    orders = await get_pending_orders(current_user.id, db)
    return orders


@router.delete("/{order_id}/cancel")
async def cancel(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await cancel_order(current_user.id, order_id, db)
    await db.commit()
    return {"cancelled": str(order_id)}


@router.post("/{order_id}/activate")
async def activate(
    order_id: uuid.UUID,
    activation_price: float = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.order import PendingOrder
    from app.services.trade_service import activate_order as svc_activate

    result = await db.execute(
        select(PendingOrder).where(
            PendingOrder.id == order_id,
            PendingOrder.user_id == current_user.id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    trade = await svc_activate(order, Decimal(str(activation_price)), db)
    await db.commit()
    await db.refresh(trade)

    return {
        "id":          str(trade.id),
        "symbol":      trade.symbol,
        "market":      trade.market,
        "trade_type":  trade.trade_type,
        "lot_size":    trade.lot_size,
        "volume":      trade.volume,
        "entry_price": str(trade.entry_price),
        "tp_price":    str(trade.tp_price)  if trade.tp_price  else None,
        "sl_price":    str(trade.sl_price)  if trade.sl_price  else None,
        "margin":      str(trade.margin),
    }