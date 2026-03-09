from decimal import Decimal
import pytest
from httpx import AsyncClient

BUY_ORDER = {
    "symbol": "EUR/USD",
    "market": "Forex",
    "order_type": "BUY",
    "lot_size": "Mini",
    "volume": 1,
    "entry_price": "1.0800",
    "tp_price": "1.0900",
    "sl_price": "1.0750",
}

SELL_ORDER = {**BUY_ORDER, "order_type": "SELL", "tp_price": "1.0700", "sl_price": "1.0850"}


@pytest.mark.asyncio
async def test_place_buy_order_deducts_margin(client: AsyncClient, funded_user: dict):
    wallet_before = await client.get("/api/wallet", headers=funded_user["headers"])
    balance_before = Decimal(wallet_before.json()["balance"])

    res = await client.post("/api/orders/place", json=BUY_ORDER, headers=funded_user["headers"])
    assert res.status_code == 201
    margin = Decimal(res.json()["margin"])

    wallet_after = await client.get("/api/wallet", headers=funded_user["headers"])
    reserved = Decimal(wallet_after.json()["reserved_margin"])
    assert reserved == margin
    # Balance unchanged — only reserved_margin increases
    assert Decimal(wallet_after.json()["balance"]) == balance_before


@pytest.mark.asyncio
async def test_place_sell_order_deducts_margin(client: AsyncClient, funded_user: dict):
    res = await client.post("/api/orders/place", json=SELL_ORDER, headers=funded_user["headers"])
    assert res.status_code == 201
    assert "margin" in res.json()


@pytest.mark.asyncio
async def test_place_order_appears_in_pending_list(client: AsyncClient, funded_user: dict):
    await client.post("/api/orders/place", json=BUY_ORDER, headers=funded_user["headers"])
    res = await client.get("/api/orders/pending", headers=funded_user["headers"])
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) >= 1
    assert orders[0]["symbol"] == "EUR/USD"


@pytest.mark.asyncio
async def test_place_order_insufficient_balance(client: AsyncClient, registered_user: dict):
    res = await client.post("/api/orders/place", json=BUY_ORDER, headers=registered_user["headers"])
    assert res.status_code == 402
    assert "Insufficient" in res.json()["detail"]


@pytest.mark.asyncio
async def test_cancel_order_returns_margin(client: AsyncClient, funded_user: dict):
    place_res = await client.post("/api/orders/place", json=BUY_ORDER, headers=funded_user["headers"])
    order_id = place_res.json()["id"]
    margin = Decimal(place_res.json()["margin"])

    wallet_mid = await client.get("/api/wallet", headers=funded_user["headers"])
    reserved_mid = Decimal(wallet_mid.json()["reserved_margin"])

    cancel_res = await client.delete(f"/api/orders/{order_id}/cancel", headers=funded_user["headers"])
    assert cancel_res.status_code == 200

    wallet_after = await client.get("/api/wallet", headers=funded_user["headers"])
    reserved_after = Decimal(wallet_after.json()["reserved_margin"])
    assert reserved_after == reserved_mid - margin


@pytest.mark.asyncio
async def test_cancel_order_removes_from_pending(client: AsyncClient, funded_user: dict):
    place_res = await client.post("/api/orders/place", json=BUY_ORDER, headers=funded_user["headers"])
    order_id = place_res.json()["id"]
    await client.delete(f"/api/orders/{order_id}/cancel", headers=funded_user["headers"])

    pending = await client.get("/api/orders/pending", headers=funded_user["headers"])
    ids = [o["id"] for o in pending.json()]
    assert order_id not in ids


@pytest.mark.asyncio
async def test_cancel_nonexistent_order(client: AsyncClient, funded_user: dict):
    import uuid
    fake_id = str(uuid.uuid4())
    res = await client.delete(f"/api/orders/{fake_id}/cancel", headers=funded_user["headers"])
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_place_order_invalid_market(client: AsyncClient, funded_user: dict):
    bad = {**BUY_ORDER, "market": "NFTs"}
    res = await client.post("/api/orders/place", json=bad, headers=funded_user["headers"])
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_place_order_invalid_volume(client: AsyncClient, funded_user: dict):
    bad = {**BUY_ORDER, "volume": 0}
    res = await client.post("/api/orders/place", json=bad, headers=funded_user["headers"])
    assert res.status_code == 422