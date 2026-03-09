from decimal import Decimal
from pydantic import BaseModel


class PeterAnalysisRequest(BaseModel):
    symbol: str
    market: str
    live_price: Decimal
    options: list[str]   # e.g. ["volatile", "bestPairs", "surpriseMe"]


class PeterAnalysisResponse(BaseModel):
    recommended_symbol: str
    recommended_market: str
    direction: str          # BUY / SELL
    strategy: str
    entry: Decimal
    take_profit: Decimal
    stop_loss: Decimal
    lot_size: str
    volume: int
    reasoning: str
    uses_remaining: int     # how many requests the user has left today