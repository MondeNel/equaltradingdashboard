from decimal import Decimal

# ZAR per pip values per lot size
LOT_PIP_VALUES: dict[str, Decimal] = {
    "Macro": Decimal("0.10"),
    "Mini": Decimal("1.00"),
    "Standard": Decimal("10.00"),
}

USD_TO_ZAR = Decimal("18.02")


def get_pip_size(price: Decimal) -> Decimal:
    """
    Returns the pip size for an instrument based on its price.
    - Price < 200  (forex, XRP): 1 pip = 0.0001
    - Price >= 200 (BTC, stocks): 1 pip = 1.0
    """
    if price < Decimal("200"):
        return Decimal("0.0001")
    return Decimal("1.0")


def calculate_pips(price_a: Decimal, price_b: Decimal, instrument_price: Decimal) -> Decimal:
    """Absolute pip distance between two prices."""
    pip_size = get_pip_size(instrument_price)
    return abs(price_a - price_b) / pip_size


def calculate_pnl_zar(
    trade_type: str,
    entry_price: Decimal,
    close_price: Decimal,
    lot_size: str,
    volume: int,
    symbol: str,
) -> tuple[Decimal, Decimal]:
    """
    Returns (pnl_zar, pips) for a closed trade.

    pnl is positive for profit, negative for loss.
    """
    pip_size = get_pip_size(entry_price)
    pip_val = LOT_PIP_VALUES.get(lot_size, Decimal("1.00"))

    if trade_type == "BUY":
        diff = close_price - entry_price
    else:
        diff = entry_price - close_price

    pips = diff / pip_size
    is_zar_pair = "ZAR" in symbol.upper()
    fx_rate = Decimal("1") if is_zar_pair else USD_TO_ZAR

    pnl_zar = pips * pip_val * Decimal(str(volume)) * fx_rate

    return pnl_zar.quantize(Decimal("0.0001")), pips.quantize(Decimal("0.01"))


def calculate_margin(lot_size: str, volume: int) -> Decimal:
    """
    Simple flat margin: max(50, pip_value × volume × 20)
    """
    pip_val = LOT_PIP_VALUES.get(lot_size, Decimal("1.00"))
    margin = pip_val * Decimal(str(volume)) * Decimal("20")
    return max(Decimal("50.00"), margin).quantize(Decimal("0.0001"))