from app.routers.auth import router as auth_router
from app.routers.wallet import router as wallet_router
from app.routers.orders import router as orders_router
from app.routers.trades import router as trades_router
from app.routers.prices import router as prices_router
from app.routers.peter import router as peter_router
from app.routers.subscriptions import router as subscriptions_router

__all__ = [
    "auth_router",
    "wallet_router",
    "orders_router",
    "trades_router",
    "prices_router",
    "peter_router",
    "subscriptions_router",
]