import asyncio
import uuid
from decimal import Decimal
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.wallet import Wallet
from app.models.subscription import Subscription
from app.services.auth_service import create_access_token, hash_password

# ── Test database URL ────────────────────────────────────────────────────────
TEST_DATABASE_URL = (
    "postgresql+asyncpg://equal_test:equal_test_password@localhost:5433/equal_test_db"
)

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Session-scoped event loop ────────────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Create / drop tables once per session ───────────────────────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── Per-test DB session (rolls back after each test) ────────────────────────
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        async with TestSessionLocal(bind=conn) as session:
            yield session
            await session.rollback()


# ── Override get_db with test session ───────────────────────────────────────
@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Registered user (no funds) ───────────────────────────────────────────────
@pytest_asyncio.fixture
async def registered_user(db_session: AsyncSession) -> dict:
    user = User(
        email=f"test_{uuid.uuid4().hex[:8]}@equal.test",
        hashed_password=hash_password("TestPass123"),
        display_name="Test User",
    )
    db_session.add(user)
    await db_session.flush()

    db_session.add(Wallet(user_id=user.id))
    db_session.add(Subscription(user_id=user.id))
    await db_session.flush()

    token = create_access_token(user.id)
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


# ── Funded user (R5 000 balance) ─────────────────────────────────────────────
@pytest_asyncio.fixture
async def funded_user(db_session: AsyncSession) -> dict:
    user = User(
        email=f"funded_{uuid.uuid4().hex[:8]}@equal.test",
        hashed_password=hash_password("TestPass123"),
        display_name="Funded User",
    )
    db_session.add(user)
    await db_session.flush()

    wallet = Wallet(user_id=user.id, balance=Decimal("5000.00"))
    db_session.add(wallet)
    db_session.add(Subscription(user_id=user.id))
    await db_session.flush()

    token = create_access_token(user.id)
    return {
        "user": user,
        "wallet": wallet,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }