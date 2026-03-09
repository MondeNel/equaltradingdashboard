import uuid
from fastapi import APIRouter, Depends
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
    return order


@router.get("/pending", response_model=list[OrderResponse])
async def list_pending(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_pending_orders(current_user.id, db)


@router.delete("/{order_id}/cancel", response_model=OrderResponse)
async def cancel(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await cancel_order(current_user.id, order_id, db)