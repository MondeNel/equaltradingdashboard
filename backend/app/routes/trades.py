import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.trade import CloseTradeResponse, TradeHistoryResponse, TradeResponse
from app.services.price_service import get_price
from app.services.trade_service import (
    close_all_trades, close_trade, get_open_trades, get_trade_history
)

router = APIRouter(prefix="/api/trades", tags=["trades"])


@router.get("/open", response_model=list[TradeResponse])
async def list_open(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_open_trades(current_user.id, db)


@router.post("/{trade_id}/close", response_model=CloseTradeResponse)
async def close(
    trade_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch live price from price service
    trade_list = await get_open_trades(current_user.id, db)
    trade = next((t for t in trade_list if t.id == trade_id), None)
    if trade:
        close_price = get_price(trade.symbol) or trade.entry_price
    else:
        close_price = Decimal("0")

    return await close_trade(current_user.id, trade_id, close_price, "MANUAL", db)


@router.post("/close-all", response_model=list[CloseTradeResponse])
async def close_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trades = await get_open_trades(current_user.id, db)
    current_prices = {
        t.symbol: (get_price(t.symbol) or t.entry_price)
        for t in trades
    }
    return await close_all_trades(current_user.id, current_prices, db)


@router.get("/history", response_model=list[TradeHistoryResponse])
async def history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_trade_history(current_user.id, db)