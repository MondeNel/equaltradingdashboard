from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.wallet import Wallet
from app.models.trade import OpenTrade


@pytest.mark.asyncio
async def test_wallet_created_on_register(client: AsyncClient):
    res = await client.post("/api/auth/register", json={
        "email": "walletcreate@equal.test",
        "password": "SecurePass1",
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    wallet_res = await client.get("/api/wallet", headers=headers)
    assert wallet_res.status_code == 200
    data = wallet_res.json()
    assert Decimal(data["balance"]) == Decimal("0")
    assert Decimal(data["reserved_margin"]) == Decimal("0")


@pytest.mark.asyncio
async def test_deposit_success(client: AsyncClient, registered_user: dict):
    res = await client.post(
        "/api/wallet/deposit",
        json={"amount": "1000.00"},
        headers=registered_user["headers"],
    )
    assert res.status_code == 200
    assert Decimal(res.json()["balance"]) == Decimal("1000.00")


@pytest.mark.asyncio
async def test_deposit_below_minimum(client: AsyncClient, registered_user: dict):
    res = await client.post(
        "/api/wallet/deposit",
        json={"amount": "50.00"},
        headers=registered_user["headers"],
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_deposit_creates_transaction(client: AsyncClient, registered_user: dict):
    await client.post(
        "/api/wallet/deposit",
        json={"amount": "500.00"},
        headers=registered_user["headers"],
    )
    history = await client.get("/api/wallet/history", headers=registered_user["headers"])
    assert history.status_code == 200
    records = history.json()
    assert len(records) >= 1
    assert records[0]["tx_type"] == "DEPOSIT"
    assert Decimal(records[0]["amount"]) == Decimal("500.00")


@pytest.mark.asyncio
async def test_withdraw_success(client: AsyncClient, funded_user: dict):
    res = await client.post(
        "/api/wallet/withdraw",
        json={"amount": "200.00"},
        headers=funded_user["headers"],
    )
    assert res.status_code == 200
    assert Decimal(res.json()["balance"]) == Decimal("4800.00")


@pytest.mark.asyncio
async def test_withdraw_below_minimum(client: AsyncClient, funded_user: dict):
    res = await client.post(
        "/api/wallet/withdraw",
        json={"amount": "50.00"},
        headers=funded_user["headers"],
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_withdraw_exceeds_balance(client: AsyncClient, funded_user: dict):
    res = await client.post(
        "/api/wallet/withdraw",
        json={"amount": "99999.00"},
        headers=funded_user["headers"],
    )
    assert res.status_code == 400
    assert "Insufficient" in res.json()["detail"]


@pytest.mark.asyncio
async def test_withdraw_blocked_with_open_trades(
    client: AsyncClient,
    funded_user: dict,
    db_session: AsyncSession,
):
    # Plant an open trade directly in DB
    trade = OpenTrade(
        user_id=funded_user["user"].id,
        symbol="EUR/USD",
        market="Forex",
        trade_type="BUY",
        lot_size="Mini",
        volume=1,
        entry_price=Decimal("1.0842"),
        margin=Decimal("200.00"),
    )
    db_session.add(trade)
    await db_session.flush()

    res = await client.post(
        "/api/wallet/withdraw",
        json={"amount": "100.00"},
        headers=funded_user["headers"],
    )
    assert res.status_code == 409
    assert "open positions" in res.json()["detail"]


@pytest.mark.asyncio
async def test_transaction_history_order(client: AsyncClient, registered_user: dict):
    await client.post("/api/wallet/deposit", json={"amount": "500"}, headers=registered_user["headers"])
    await client.post("/api/wallet/deposit", json={"amount": "1000"}, headers=registered_user["headers"])
    res = await client.get("/api/wallet/history", headers=registered_user["headers"])
    records = res.json()
    # Most recent first
    assert Decimal(records[0]["amount"]) == Decimal("1000.00")