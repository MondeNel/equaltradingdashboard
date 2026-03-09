from decimal import Decimal
from datetime import datetime
import uuid
from pydantic import BaseModel


class TradeResponse(BaseModel):
    id: uuid.UUID
    symbol: str
    market: str
    trade_type: str
    lot_size: str
    volume: int
    entry_price: Decimal
    tp_price: Decimal | None
    sl_price: Decimal | None
    margin: Decimal
    activated_at: datetime

    model_config = {"from_attributes": True}


class CloseTradeResponse(BaseModel):
    trade_id: uuid.UUID
    symbol: str
    trade_type: str
    close_price: Decimal
    pnl: Decimal
    pips: Decimal
    close_reason: str
    margin_returned: Decimal


class TradeHistoryResponse(BaseModel):
    id: uuid.UUID
    symbol: str
    trade_type: str
    lot_size: str
    volume: int
    entry_price: Decimal
    close_price: Decimal
    pnl: Decimal
    pips: Decimal
    close_reason: str
    opened_at: datetime
    closed_at: datetime

    model_config = {"from_attributes": True}