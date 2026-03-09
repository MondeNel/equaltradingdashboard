from decimal import Decimal
import pytest
from httpx import AsyncClient

from app.services.price_service import BASE_PRICES, get_price, tick_price, BOUND_PCT


# ── REST endpoint ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_price_known_symbol(client: AsyncClient):
    res = await client.get("/api/prices/EUR/USD")
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "EUR/USD"
    assert isinstance(data["price"], float)
    assert data["price"] > 0


@pytest.mark.asyncio
async def test_get_price_unknown_symbol(client: AsyncClient):
    res = await client.get("/api/prices/FAKE/XXX")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_list_all_prices(client: AsyncClient):
    res = await client.get("/api/prices")
    assert res.status_code == 200
    data = res.json()
    for symbol in BASE_PRICES:
        assert symbol in data
        assert data[symbol] > 0


# ── Price service unit tests ──────────────────────────────────────────────────

def test_get_price_returns_value():
    price = get_price("BTC/USD")
    assert price is not None
    assert price > Decimal("0")


def test_get_price_unknown_returns_none():
    assert get_price("UNKNOWN/SYM") is None


def test_tick_price_stays_within_bounds():
    symbol = "EUR/USD"
    base = BASE_PRICES[symbol]
    lower = base * (1 - BOUND_PCT)
    upper = base * (1 + BOUND_PCT)

    for _ in range(100):
        price = tick_price(symbol)
        assert lower <= price <= upper, (
            f"Price {price} out of bounds [{lower}, {upper}]"
        )


def test_tick_price_btc_stays_within_bounds():
    symbol = "BTC/USD"
    base = BASE_PRICES[symbol]
    lower = base * (1 - BOUND_PCT)
    upper = base * (1 + BOUND_PCT)

    for _ in range(50):
        price = tick_price(symbol)
        assert lower <= price <= upper


def test_all_symbols_have_prices():
    for symbol in BASE_PRICES:
        price = get_price(symbol)
        assert price is not None, f"Missing price for {symbol}"
        assert price > 0