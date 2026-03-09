import asyncio
import random
from decimal import Decimal

# Base prices for all supported instruments
BASE_PRICES: dict[str, Decimal] = {
    "BTC/USD":  Decimal("68420.50"),
    "ETH/USD":  Decimal("3821.10"),
    "SOL/USD":  Decimal("182.40"),
    "XRP/USD":  Decimal("0.6200"),
    "USD/ZAR":  Decimal("18.0214"),
    "EUR/USD":  Decimal("1.0842"),
    "GBP/USD":  Decimal("1.2710"),
    "USD/JPY":  Decimal("149.82"),
    "APPLE":    Decimal("189.45"),
    "TESLA":    Decimal("248.90"),
    "NVIDIA":   Decimal("875.60"),
    "AMAZON":   Decimal("182.30"),
}

# Live price state (in-memory simulation)
_live_prices: dict[str, Decimal] = dict(BASE_PRICES)
DRIFT_PCT = Decimal("0.0004")    # max movement per tick
BOUND_PCT = Decimal("0.015")     # ±1.5% from base price


def get_price(symbol: str) -> Decimal | None:
    return _live_prices.get(symbol)


def tick_price(symbol: str) -> Decimal:
    """Apply one random walk step and return the new price."""
    base = BASE_PRICES.get(symbol)
    if not base:
        return _live_prices.get(symbol, Decimal("0"))

    current = _live_prices[symbol]
    drift = (Decimal(str(random.uniform(-1, 0.98))) * base * DRIFT_PCT)
    new_price = current + drift

    # Clamp to ±1.5% of base
    lower = base * (1 - BOUND_PCT)
    upper = base * (1 + BOUND_PCT)
    new_price = max(lower, min(upper, new_price))

    _live_prices[symbol] = new_price.quantize(
        Decimal("0.0001") if new_price < 200 else Decimal("0.01")
    )
    return _live_prices[symbol]


async def price_generator(symbol: str):
    """Async generator that yields price ticks every 400ms."""
    while True:
        price = tick_price(symbol)
        yield price
        await asyncio.sleep(0.4)