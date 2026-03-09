from decimal import Decimal
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trade import OpenTrade
from app.models.wallet import Wallet
from app.services.trade_service import close_trade, get_open_trades, get_trade_history
from sqlalchemy import select


async def _plant_trade(db: AsyncSession, user_id, **kwargs) -> OpenTrade:
    """Helper — insert an OpenTrade directly into the test DB."""
    defaults = dict(
        symbol="EUR/USD", market="Forex", trade_type="BUY",
        lot_size="Mini", volume=1,
        entry_price=Decimal("1.0842"),
        tp_price=Decimal("1.0942"),
        sl_price=Decimal("1.0742"),
        margin=Decimal("200.00"),
    )
    defaults.update(kwargs)
    trade = OpenTrade(user_id=user_id, **defaults)
    db.add(trade)
    await db.flush()
    return trade


@pytest.mark.asyncio
async def test_open_trades_initially_empty(client: AsyncClient, funded_user: dict):
    res = await client.get("/api/trades/open", headers=funded_user["headers"])
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_close_buy_trade_with_profit(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(db_session, funded_user["user"].id)

    # Simulate: wallet already has reserved margin
    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin = trade.margin
    await db_session.flush()

    # Close at price above entry → profit
    close_price = Decimal("1.0942")  # == tp_price, 100 pips profit
    result = await close_trade(funded_user["user"].id, trade.id, close_price, "TP", db_session)

    assert result.pnl > Decimal("0"), "Should be profitable"
    assert result.close_reason == "TP"
    assert result.pips > Decimal("0")


@pytest.mark.asyncio
async def test_close_buy_trade_with_loss(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(db_session, funded_user["user"].id)

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += trade.margin
    await db_session.flush()

    # Close below entry → loss
    close_price = Decimal("1.0742")  # == sl_price, 100 pips loss
    result = await close_trade(funded_user["user"].id, trade.id, close_price, "SL", db_session)

    assert result.pnl < Decimal("0"), "Should be a loss"
    assert result.close_reason == "SL"


@pytest.mark.asyncio
async def test_close_sell_trade_with_profit(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(
        db_session, funded_user["user"].id,
        trade_type="SELL",
        entry_price=Decimal("1.0842"),
        tp_price=Decimal("1.0742"),  # profit is below entry for SELL
        sl_price=Decimal("1.0942"),
    )

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += trade.margin
    await db_session.flush()

    close_price = Decimal("1.0742")  # price fell → profit
    result = await close_trade(funded_user["user"].id, trade.id, close_price, "TP", db_session)

    assert result.pnl > Decimal("0"), "SELL trade should profit when price falls"


@pytest.mark.asyncio
async def test_close_sell_trade_with_loss(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(
        db_session, funded_user["user"].id,
        trade_type="SELL",
        entry_price=Decimal("1.0842"),
        tp_price=Decimal("1.0742"),
        sl_price=Decimal("1.0942"),
    )

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += trade.margin
    await db_session.flush()

    close_price = Decimal("1.0942")  # price rose → loss for SELL
    result = await close_trade(funded_user["user"].id, trade.id, close_price, "SL", db_session)

    assert result.pnl < Decimal("0"), "SELL trade should lose when price rises"


@pytest.mark.asyncio
async def test_margin_returned_on_close(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(db_session, funded_user["user"].id)
    margin = trade.margin

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += margin
    reserved_before = wallet.reserved_margin
    await db_session.flush()

    await close_trade(funded_user["user"].id, trade.id, Decimal("1.0900"), "MANUAL", db_session)

    wallet_after = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    w = wallet_after.scalar_one()
    assert w.reserved_margin == reserved_before - margin


@pytest.mark.asyncio
async def test_closed_trade_saved_to_history(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(db_session, funded_user["user"].id)

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += trade.margin
    await db_session.flush()

    await close_trade(funded_user["user"].id, trade.id, Decimal("1.0900"), "MANUAL", db_session)

    history = await get_trade_history(funded_user["user"].id, db_session)
    assert len(history) >= 1
    assert str(history[0].trade_id) == str(trade.id)


@pytest.mark.asyncio
async def test_close_trade_via_api(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(db_session, funded_user["user"].id)

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += trade.margin
    await db_session.flush()

    res = await client.post(f"/api/trades/{trade.id}/close", headers=funded_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["trade_id"] == str(trade.id)
    assert "pnl" in data


@pytest.mark.asyncio
async def test_close_nonexistent_trade(client: AsyncClient, funded_user: dict):
    fake_id = str(uuid.uuid4())
    res = await client.post(f"/api/trades/{fake_id}/close", headers=funded_user["headers"])
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_close_all_trades(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    # Plant two trades
    t1 = await _plant_trade(db_session, funded_user["user"].id, symbol="EUR/USD")
    t2 = await _plant_trade(db_session, funded_user["user"].id, symbol="GBP/USD")

    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += t1.margin + t2.margin
    await db_session.flush()

    res = await client.post("/api/trades/close-all", headers=funded_user["headers"])
    assert res.status_code == 200
    assert len(res.json()) == 2

    open_after = await get_open_trades(funded_user["user"].id, db_session)
    assert len(open_after) == 0


@pytest.mark.asyncio
async def test_trade_history_endpoint(
    client: AsyncClient, funded_user: dict, db_session: AsyncSession
):
    trade = await _plant_trade(db_session, funded_user["user"].id)
    wallet_res = await db_session.execute(select(Wallet).where(Wallet.user_id == funded_user["user"].id))
    wallet = wallet_res.scalar_one()
    wallet.reserved_margin += trade.margin
    await db_session.flush()

    await client.post(f"/api/trades/{trade.id}/close", headers=funded_user["headers"])

    res = await client.get("/api/trades/history", headers=funded_user["headers"])
    assert res.status_code == 200
    assert len(res.json()) >= 1