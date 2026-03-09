from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.config import get_settings
from app.database import engine, Base
from app.routers.auth import router as auth_router
from app.routers.wallet import router as wallet_router
from app.routers.orders import router as orders_router
from app.routers.trades import router as trades_router
from app.routers.prices import router as prices_router
from app.routers.peter import router as peter_router
from app.routers.subscriptions import router as subscriptions_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(wallet_router)
app.include_router(orders_router)
app.include_router(trades_router)
app.include_router(prices_router)
app.include_router(peter_router)
app.include_router(subscriptions_router)



app.include_router(subscriptions_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "eQual API"}