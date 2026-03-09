from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from app.services.price_service import BASE_PRICES, get_price, price_generator

router = APIRouter(tags=["prices"])


@router.get("/api/prices/{symbol:path}")
async def get_current_price(symbol: str):
    price = get_price(symbol)
    if price is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol '{symbol}' not found. Available: {list(BASE_PRICES.keys())}",
        )
    return {"symbol": symbol, "price": float(price)}


@router.get("/api/prices")
async def list_prices():
    """Return current prices for all symbols."""
    return {sym: float(p) for sym, p in zip(BASE_PRICES.keys(), [get_price(s) for s in BASE_PRICES])}


@router.websocket("/ws/prices/{symbol}")
async def websocket_price_feed(websocket: WebSocket, symbol: str):
    if symbol not in BASE_PRICES:
        await websocket.close(code=4004, reason=f"Unknown symbol: {symbol}")
        return

    await websocket.accept()
    try:
        async for price in price_generator(symbol):
            await websocket.send_json({"symbol": symbol, "price": float(price)})
    except WebSocketDisconnect:
        pass