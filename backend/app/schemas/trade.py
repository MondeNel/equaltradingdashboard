import uuid
from decimal import Decimal
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TradeResponse(BaseModel):
    id: uuid.UUID
    symbol: str
    market: str
    trade_type: str
    lot_size: str
    volume: int
    entry_price: Decimal
    tp_price: Optional[Decimal] = None
    sl_price: Optional[Decimal] = None
    margin: Decimal
    activated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CloseTradeResponse(BaseModel):
    trade_id: uuid.UUID
    symbol: str
    trade_type: str
    close_price: Decimal
    pnl: Decimal
    pips: float
    close_reason: str
    margin_returned: Decimal

    class Config:
        from_attributes = True


class TradeHistoryResponse(BaseModel):
    id: uuid.UUID
    symbol: str
    market: str
    trade_type: str
    lot_size: str
    volume: int
    entry_price: Decimal
    close_price: Decimal
    tp_price: Optional[Decimal] = None
    sl_price: Optional[Decimal] = None
    pnl: Decimal
    pips: float
    close_reason: str
    margin_returned: Decimal
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True