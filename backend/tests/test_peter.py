from decimal import Decimal
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from unittest.mock import AsyncMock, patch, MagicMock

from app.models.subscription import Subscription

ANALYSE_PAYLOAD = {
    "symbol": "EUR/USD",
    "market": "Forex",
    "live_price": "1.0842",
    "options": ["bestPairs"],
}

MOCK_CLAUDE_RESPONSE = """{
  "recommendedSymbol": "EUR/USD",
  "recommendedMarket": "Forex",
  "direction": "BUY",
  "strategy": "Breakout scalp",
  "entry": 1.0842,
  "takeProfit": 1.0942,
  "stopLoss": 1.0742,
  "lotSize": "Mini",
  "volume": 3,
  "reasoning": "Price is testing support with bullish momentum."
}"""


def _mock_anthropic():
    """Patch anthropic.Anthropic so no real API calls are made in tests."""
    mock_client = MagicMock()
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=MOCK_CLAUDE_RESPONSE)]
    mock_client.messages.create.return_value = mock_message
    return mock_client


@pytest.mark.asyncio
async def test_analyse_returns_required_fields(
    client: AsyncClient, registered_user: dict, db_session: AsyncSession
):
    with patch("app.services.peter_service.anthropic.Anthropic", return_value=_mock_anthropic()):
        res = await client.post(
            "/api/peter/analyse",
            json=ANALYSE_PAYLOAD,
            headers=registered_user["headers"],
        )
    assert res.status_code == 200
    data = res.json()
    for field in ["recommended_symbol", "direction", "entry", "take_profit", "stop_loss",
                  "lot_size", "volume", "reasoning", "uses_remaining"]:
        assert field in data, f"Missing field: {field}"


@pytest.mark.asyncio
async def test_analyse_increments_usage(
    client: AsyncClient, registered_user: dict, db_session: AsyncSession
):
    with patch("app.services.peter_service.anthropic.Anthropic", return_value=_mock_anthropic()):
        await client.post("/api/peter/analyse", json=ANALYSE_PAYLOAD, headers=registered_user["headers"])

    result = await db_session.execute(
        select(Subscription).where(Subscription.user_id == registered_user["user"].id)
    )
    sub = result.scalar_one_or_none()
    assert sub is not None
    assert sub.peter_uses_today == 1


@pytest.mark.asyncio
async def test_free_user_blocked_after_limit(
    client: AsyncClient, registered_user: dict, db_session: AsyncSession
):
    # Set usage to limit
    result = await db_session.execute(
        select(Subscription).where(Subscription.user_id == registered_user["user"].id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=registered_user["user"].id)
        db_session.add(sub)
    sub.peter_uses_today = sub.peter_limit  # exhaust limit
    await db_session.flush()

    with patch("app.services.peter_service.anthropic.Anthropic", return_value=_mock_anthropic()):
        res = await client.post(
            "/api/peter/analyse",
            json=ANALYSE_PAYLOAD,
            headers=registered_user["headers"],
        )
    assert res.status_code == 402
    assert "limit" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_subscribed_user_not_blocked(
    client: AsyncClient, registered_user: dict, db_session: AsyncSession
):
    result = await db_session.execute(
        select(Subscription).where(Subscription.user_id == registered_user["user"].id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=registered_user["user"].id)
        db_session.add(sub)
    sub.plan = "MONTHLY"
    sub.peter_limit = -1  # unlimited
    sub.peter_uses_today = 999
    await db_session.flush()

    with patch("app.services.peter_service.anthropic.Anthropic", return_value=_mock_anthropic()):
        res = await client.post(
            "/api/peter/analyse",
            json=ANALYSE_PAYLOAD,
            headers=registered_user["headers"],
        )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_analyse_missing_fields(client: AsyncClient, registered_user: dict):
    res = await client.post(
        "/api/peter/analyse",
        json={"symbol": "EUR/USD"},   # missing required fields
        headers=registered_user["headers"],
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_analyse_unauthenticated(client: AsyncClient):
    res = await client.post("/api/peter/analyse", json=ANALYSE_PAYLOAD)
    assert res.status_code == 403