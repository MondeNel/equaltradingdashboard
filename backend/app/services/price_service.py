import asyncio
import random
import httpx
from decimal import Decimal

# ── Base / fallback prices ────────────────────────────────────────────────────
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

# ── CoinGecko symbol map ──────────────────────────────────────────────────────
COINGECKO_IDS = {
    "BTC/USD": "bitcoin",
    "ETH/USD": "ethereum",
    "SOL/USD": "solana",
    "XRP/USD": "ripple",
}

# ── Frankfurter forex symbol map (free, no key needed) ───────────────────────
# Base currency → quote currency
FOREX_PAIRS = {
    "USD/ZAR": ("USD", "ZAR"),
    "EUR/USD": ("EUR", "USD"),
    "GBP/USD": ("GBP", "USD"),
    "USD/JPY": ("USD", "JPY"),
}

# ── Live price state ──────────────────────────────────────────────────────────
_live_prices: dict[str, Decimal] = dict(BASE_PRICES)

DRIFT_PCT = Decimal("0.0004")
BOUND_PCT = Decimal("0.015")


def get_price(symbol: str) -> Decimal | None:
    return _live_prices.get(symbol)


def tick_price(symbol: str) -> Decimal:
    """Apply one random walk step around current real price."""
    base = _live_prices.get(symbol) or BASE_PRICES.get(symbol)
    if not base:
        return _live_prices.get(symbol, Decimal("0"))
    current = _live_prices[symbol]
    drift = Decimal(str(random.uniform(-1, 0.98))) * base * DRIFT_PCT
    new_price = current + drift
    lower = base * Decimal("0.998")
    upper = base * Decimal("1.002")
    new_price = max(lower, min(upper, new_price))
    _live_prices[symbol] = new_price.quantize(
        Decimal("0.0001") if new_price < 200 else Decimal("0.01")
    )
    return _live_prices[symbol]


async def fetch_coingecko_prices() -> None:
    """Fetch real crypto prices from CoinGecko free API."""
    ids = ",".join(COINGECKO_IDS.values())
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd"
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                for symbol, cg_id in COINGECKO_IDS.items():
                    price = data.get(cg_id, {}).get("usd")
                    if price:
                        _live_prices[symbol] = Decimal(str(price))
                        BASE_PRICES[symbol] = Decimal(str(price))
    except Exception as e:
        print(f"CoinGecko fetch failed: {e}")


async def fetch_forex_prices() -> None:
    """Fetch real forex rates from Frankfurter (free, no key)."""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get("https://api.frankfurter.app/latest?from=USD&to=ZAR,JPY")
            if res.status_code == 200:
                data = res.json()
                rates = data.get("rates", {})
                if "ZAR" in rates:
                    _live_prices["USD/ZAR"] = Decimal(str(rates["ZAR"]))
                    BASE_PRICES["USD/ZAR"] = Decimal(str(rates["ZAR"]))
                if "JPY" in rates:
                    _live_prices["USD/JPY"] = Decimal(str(rates["JPY"]))
                    BASE_PRICES["USD/JPY"] = Decimal(str(rates["JPY"]))

            # EUR/USD and GBP/USD
            res2 = await client.get("https://api.frankfurter.app/latest?from=EUR&to=USD")
            if res2.status_code == 200:
                rate = res2.json().get("rates", {}).get("USD")
                if rate:
                    _live_prices["EUR/USD"] = Decimal(str(rate))
                    BASE_PRICES["EUR/USD"] = Decimal(str(rate))

            res3 = await client.get("https://api.frankfurter.app/latest?from=GBP&to=USD")
            if res3.status_code == 200:
                rate = res3.json().get("rates", {}).get("USD")
                if rate:
                    _live_prices["GBP/USD"] = Decimal(str(rate))
                    BASE_PRICES["GBP/USD"] = Decimal(str(rate))

    except Exception as e:
        print(f"Forex fetch failed: {e}")


async def realtime_price_updater() -> None:
    """Background task: fetch real prices every 15s, drift between fetches."""
    print("Starting real-time price updater...")
    # Initial fetch on startup
    await fetch_coingecko_prices()
    await fetch_forex_prices()
    print(f"Initial prices loaded: BTC={_live_prices.get('BTC/USD')}, USD/ZAR={_live_prices.get('USD/ZAR')}")

    while True:
        await asyncio.sleep(15)
        await fetch_coingecko_prices()
        await fetch_forex_prices()


async def price_generator(symbol: str):
    """Async generator that yields price ticks every 400ms with micro drift."""
    while True:
        price = tick_price(symbol)
        yield price
        await asyncio.sleep(0.4)