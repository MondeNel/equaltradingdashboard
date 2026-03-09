from decimal import Decimal
import pytest

from app.utils.pip_calc import (
    calculate_margin,
    calculate_pnl_zar,
    get_pip_size,
)


# ── get_pip_size ─────────────────────────────────────────────────────────────

def test_pip_size_forex():
    assert get_pip_size(Decimal("1.0842")) == Decimal("0.0001")


def test_pip_size_xrp():
    assert get_pip_size(Decimal("0.62")) == Decimal("0.0001")


def test_pip_size_btc():
    assert get_pip_size(Decimal("68420.50")) == Decimal("1.0")


def test_pip_size_nvidia():
    assert get_pip_size(Decimal("875.60")) == Decimal("1.0")


def test_pip_size_exactly_200():
    # Boundary — price of 200 should use 1.0 pip
    assert get_pip_size(Decimal("200.00")) == Decimal("1.0")


def test_pip_size_just_below_200():
    assert get_pip_size(Decimal("199.99")) == Decimal("0.0001")


# ── calculate_pnl_zar — BUY trades ──────────────────────────────────────────

def test_buy_profit_forex_zar_pair():
    """USD/ZAR BUY — no currency conversion needed."""
    pnl, pips = calculate_pnl_zar(
        trade_type="BUY",
        entry_price=Decimal("18.00"),
        close_price=Decimal("18.10"),
        lot_size="Mini",         # R1 per pip
        volume=1,
        symbol="USD/ZAR",
    )
    # 0.10 / 0.0001 = 1000 pips × R1 × 1 = R1000
    assert pips == Decimal("1000.00")
    assert pnl == Decimal("1000.0000")


def test_buy_profit_non_zar_pair():
    """EUR/USD BUY — apply USD_TO_ZAR conversion."""
    pnl, pips = calculate_pnl_zar(
        trade_type="BUY",
        entry_price=Decimal("1.0800"),
        close_price=Decimal("1.0900"),
        lot_size="Mini",
        volume=1,
        symbol="EUR/USD",
    )
    # 100 pips × R1 × 1 × 18.02 = R1802
    assert pips == Decimal("100.00")
    assert pnl == Decimal("1802.0000")


def test_buy_loss_forex():
    pnl, pips = calculate_pnl_zar(
        trade_type="BUY",
        entry_price=Decimal("1.0842"),
        close_price=Decimal("1.0742"),
        lot_size="Mini",
        volume=1,
        symbol="EUR/USD",
    )
    assert pnl < Decimal("0"), "BUY closed below entry should be a loss"
    assert pips < Decimal("0")


def test_buy_zero_movement():
    pnl, pips = calculate_pnl_zar(
        trade_type="BUY",
        entry_price=Decimal("1.0842"),
        close_price=Decimal("1.0842"),
        lot_size="Mini",
        volume=1,
        symbol="EUR/USD",
    )
    assert pnl == Decimal("0.0000")
    assert pips == Decimal("0.00")


# ── calculate_pnl_zar — SELL trades ─────────────────────────────────────────

def test_sell_profit():
    """SELL trade profits when price falls."""
    pnl, pips = calculate_pnl_zar(
        trade_type="SELL",
        entry_price=Decimal("1.0842"),
        close_price=Decimal("1.0742"),
        lot_size="Mini",
        volume=1,
        symbol="EUR/USD",
    )
    assert pnl > Decimal("0"), "SELL closed below entry should be profit"


def test_sell_loss():
    """SELL trade loses when price rises."""
    pnl, pips = calculate_pnl_zar(
        trade_type="SELL",
        entry_price=Decimal("1.0842"),
        close_price=Decimal("1.0942"),
        lot_size="Mini",
        volume=1,
        symbol="EUR/USD",
    )
    assert pnl < Decimal("0"), "SELL closed above entry should be a loss"


# ── calculate_pnl_zar — lot sizes & volume ──────────────────────────────────

def test_standard_lot_multiplier():
    pnl_mini, _ = calculate_pnl_zar("BUY", Decimal("1.0800"), Decimal("1.0900"), "Mini", 1, "USD/ZAR")
    pnl_std, _ = calculate_pnl_zar("BUY", Decimal("1.0800"), Decimal("1.0900"), "Standard", 1, "USD/ZAR")
    assert pnl_std == pnl_mini * 10


def test_volume_multiplier():
    pnl_v1, _ = calculate_pnl_zar("BUY", Decimal("1.0800"), Decimal("1.0900"), "Mini", 1, "USD/ZAR")
    pnl_v5, _ = calculate_pnl_zar("BUY", Decimal("1.0800"), Decimal("1.0900"), "Mini", 5, "USD/ZAR")
    assert pnl_v5 == pnl_v1 * 5


def test_macro_lot():
    pnl, pips = calculate_pnl_zar("BUY", Decimal("18.00"), Decimal("18.01"), "Macro", 1, "USD/ZAR")
    # 100 pips × 0.10 × 1 = 10 ZAR
    assert pnl == Decimal("10.0000")


# ── calculate_margin ─────────────────────────────────────────────────────────

def test_margin_minimum_floor():
    # Macro lot volume=1 → 0.10 × 1 × 20 = 2 → clamped to 50
    margin = calculate_margin("Macro", 1)
    assert margin == Decimal("50.00")


def test_margin_standard_high_volume():
    # Standard lot volume=10 → 10 × 10 × 20 = 2000
    margin = calculate_margin("Standard", 10)
    assert margin == Decimal("2000.0000")


def test_margin_mini_mid_volume():
    # Mini volume=5 → 1 × 5 × 20 = 100
    margin = calculate_margin("Mini", 5)
    assert margin == Decimal("100.0000")