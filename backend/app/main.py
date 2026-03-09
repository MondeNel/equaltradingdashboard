from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, wallet, orders, trades, prices, peter, subscriptions

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="eQual Trading Platform API",
    description="Simulation trading platform — paper trade forex, crypto and stocks.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(orders.router)
app.include_router(trades.router)
app.include_router(prices.router)
app.include_router(peter.router)
app.include_router(subscriptions.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "eQual API"}