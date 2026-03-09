import json
from decimal import Decimal
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import anthropic

from app.config import get_settings
from app.models.subscription import Subscription
from app.schemas.peter import PeterAnalysisRequest, PeterAnalysisResponse

settings = get_settings()

SYSTEM_PROMPT = """You are Peter, an expert trading analyst for the eQual simulation trading platform.
Your job is to analyse the current market conditions and recommend a specific trade setup.

You MUST respond with valid JSON only — no markdown, no explanation outside the JSON.

Return exactly this structure:
{
  "recommendedSymbol": "string",
  "recommendedMarket": "Forex|Crypto|Stocks",
  "direction": "BUY|SELL",
  "strategy": "short description of strategy",
  "entry": number,
  "takeProfit": number,
  "stopLoss": number,
  "lotSize": "Macro|Mini|Standard",
  "volume": integer between 1 and 10,
  "reasoning": "2-3 sentence explanation of why this trade"
}

Rules:
- Entry, TP and SL must be realistic prices near the current live price
- For BUY: takeProfit > entry > stopLoss
- For SELL: takeProfit < entry < stopLoss
- Keep TP/SL within 2% of entry for forex, 5% for crypto/stocks
"""


async def check_and_increment_usage(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Subscription:
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=user_id)
        db.add(sub)
        await db.flush()

    if not sub.can_use_peter:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Peter AI usage limit reached ({sub.peter_limit} requests). Please subscribe for more.",
        )

    sub.peter_uses_today += 1
    await db.flush()
    return sub


async def analyse(
    user_id: uuid.UUID,
    req: PeterAnalysisRequest,
    db: AsyncSession,
) -> PeterAnalysisResponse:
    sub = await check_and_increment_usage(user_id, db)

    options_text = ", ".join(req.options) if req.options else "general market analysis"
    user_message = (
        f"Current instrument: {req.symbol} ({req.market})\n"
        f"Live price: {req.live_price}\n"
        f"Analysis focus: {options_text}\n\n"
        "Please recommend a trade setup."
    )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = message.content[0].text
        data = json.loads(raw)
    except (json.JSONDecodeError, IndexError, anthropic.APIError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Peter AI response error: {str(e)}",
        )

    uses_remaining = (
        -1 if sub.is_unlimited
        else max(0, sub.peter_limit - sub.peter_uses_today)
    )

    return PeterAnalysisResponse(
        recommended_symbol=data["recommendedSymbol"],
        recommended_market=data["recommendedMarket"],
        direction=data["direction"],
        strategy=data["strategy"],
        entry=Decimal(str(data["entry"])),
        take_profit=Decimal(str(data["takeProfit"])),
        stop_loss=Decimal(str(data["stopLoss"])),
        lot_size=data["lotSize"],
        volume=int(data["volume"]),
        reasoning=data["reasoning"],
        uses_remaining=uses_remaining,
    )