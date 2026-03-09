from decimal import Decimal
from datetime import datetime, timezone
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.order import PendingOrder
from app.models.trade import OpenTrade, TradeHistory
from app.schemas.trade import CloseTradeResponse
from app.services.wallet_service import release_margin
from app.utils.pip_calc import calculate_pnl_zar


async def activate_order(
    order: PendingOrder,
    activation_price: Decimal,
    db: AsyncSession,
) -> OpenTrade:
    """Promote a pending order to an active open trade."""
    trade = OpenTrade(
        user_id=order.user_id,
        order_id=order.id,
        symbol=order.symbol,
        market=order.market,
        trade_type=order.order_type,
        lot_size=order.lot_size,
        volume=order.volume,
        entry_price=activation_price,
        tp_price=order.tp_price,
        sl_price=order.sl_price,
        margin=order.margin,
    )
    db.add(trade)
    await db.delete(order)
    await db.flush()
    return trade


async def close_trade(
    user_id: uuid.UUID,
    trade_id: uuid.UUID,
    close_price: Decimal,
    close_reason: str,
    db: AsyncSession,
) -> CloseTradeResponse:
    result = await db.execute(
        select(OpenTrade).where(
            OpenTrade.id == trade_id,
            OpenTrade.user_id == user_id,
        )
    )
    trade = result.scalar_one_or_none()

    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Open trade not found",
        )

    pnl, pips = calculate_pnl_zar(
        trade_type=trade.trade_type,
        entry_price=trade.entry_price,
        close_price=close_price,
        lot_size=trade.lot_size,
        volume=trade.volume,
        symbol=trade.symbol,
    )

    # Return margin + P&L to wallet
    await release_margin(user_id, trade.margin, pnl, db)

    # Write to history
    history = TradeHistory(
        user_id=user_id,
        trade_id=trade.id,
        symbol=trade.symbol,
        market=trade.market,
        trade_type=trade.trade_type,
        lot_size=trade.lot_size,
        volume=trade.volume,
        entry_price=trade.entry_price,
        close_price=close_price,
        tp_price=trade.tp_price,
        sl_price=trade.sl_price,
        close_reason=close_reason,
        pnl=pnl,
        pips=pips,
        margin_returned=trade.margin,
        opened_at=trade.activated_at,
    )
    db.add(history)
    await db.delete(trade)
    await db.flush()

    return CloseTradeResponse(
        trade_id=trade_id,
        symbol=trade.symbol,
        trade_type=trade.trade_type,
        close_price=close_price,
        pnl=pnl,
        pips=pips,
        close_reason=close_reason,
        margin_returned=trade.margin,
    )


async def close_all_trades(
    user_id: uuid.UUID,
    current_prices: dict[str, Decimal],
    db: AsyncSession,
) -> list[CloseTradeResponse]:
    result = await db.execute(
        select(OpenTrade).where(OpenTrade.user_id == user_id)
    )
    trades = list(result.scalars().all())
    results = []

    for trade in trades:
        price = current_prices.get(trade.symbol, trade.entry_price)
        closed = await close_trade(user_id, trade.id, price, "MANUAL", db)
        results.append(closed)

    return results


async def get_open_trades(user_id: uuid.UUID, db: AsyncSession) -> list[OpenTrade]:
    result = await db.execute(
        select(OpenTrade)
        .where(OpenTrade.user_id == user_id)
        .order_by(OpenTrade.activated_at.desc())
    )
    return list(result.scalars().all())


async def get_trade_history(user_id: uuid.UUID, db: AsyncSession) -> list[TradeHistory]:
    result = await db.execute(
        select(TradeHistory)
        .where(TradeHistory.user_id == user_id)
        .order_by(TradeHistory.closed_at.desc())
    )
    return list(result.scalars().all())