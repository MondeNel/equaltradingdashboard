from decimal import Decimal
from datetime import datetime
import uuid
from pydantic import BaseModel, field_validator


VALID_MARKETS = {"Forex", "Crypto", "Stocks"}
VALID_LOT_SIZES = {"Macro", "Mini", "Standard"}
VALID_ORDER_TYPES = {"BUY", "SELL"}


class PlaceOrderRequest(BaseModel):
    symbol: str
    market: str
    order_type: str
    lot_size: str
    volume: int
    entry_price: Decimal
    tp_price: Decimal | None = None
    sl_price: Decimal | None = None

    @field_validator("market")
    @classmethod
    def valid_market(cls, v: str) -> str:
        if v not in VALID_MARKETS:
            raise ValueError(f"Market must be one of {VALID_MARKETS}")
        return v

    @field_validator("order_type")
    @classmethod
    def valid_order_type(cls, v: str) -> str:
        if v.upper() not in VALID_ORDER_TYPES:
            raise ValueError("order_type must be BUY or SELL")
        return v.upper()

    @field_validator("lot_size")
    @classmethod
    def valid_lot_size(cls, v: str) -> str:
        if v not in VALID_LOT_SIZES:
            raise ValueError(f"lot_size must be one of {VALID_LOT_SIZES}")
        return v

    @field_validator("volume")
    @classmethod
    def valid_volume(cls, v: int) -> int:
        if not (1 <= v <= 100):
            raise ValueError("Volume must be between 1 and 100")
        return v


class OrderResponse(BaseModel):
    id: uuid.UUID
    symbol: str
    market: str
    order_type: str
    lot_size: str
    volume: int
    entry_price: Decimal
    tp_price: Decimal | None
    sl_price: Decimal | None
    margin: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}