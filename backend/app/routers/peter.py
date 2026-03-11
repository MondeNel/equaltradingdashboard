import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.config import get_settings
settings = get_settings()

router = APIRouter(prefix="/peter", tags=["peter"])


class PeterRequest(BaseModel):
    symbol: str
    market: str
    live_price: float
    options: Optional[List[str]] = []


@router.post("/analyse")
async def analyse(
    req: PeterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sym_list = (
        "BTC/USD (Crypto, ~68420), ETH/USD (Crypto, ~3821), SOL/USD (Crypto, ~182), "
        "XRP/USD (Crypto, ~0.62), USD/ZAR (Forex, ~18021), EUR/USD (Forex, ~1.08), "
        "GBP/USD (Forex, ~1.27), USD/JPY (Forex, ~149), "
        "APPLE (Stocks, ~189), TESLA (Stocks, ~248), NVIDIA (Stocks, ~875), AMAZON (Stocks, ~182)"
    )

    wants = req.options if req.options else ["a general scalp trade setup"]

    prompt = (
        f"You are Peter, a scalp trading AI assistant. Use ONLY these platform symbols: {sym_list}.\n"
        f"User viewing: {req.symbol} ({req.market}), live price ~{req.live_price:.2f}.\n"
        f"User wants: {', '.join(wants)}.\n"
        f"Set entry VERY close to the symbol base price shown. TP/SL within 0.2-0.8% of entry for scalping.\n"
        f"Return ONLY raw JSON, no markdown, no explanation:\n"
        f'{{"recommended_symbol":"","recommended_market":"Crypto or Forex or Stocks",'
        f'"direction":"BUY or SELL","strategy":"one sentence","entry":0,"take_profit":0,'
        f'"stop_loss":0,"lot_size":"Macro or Mini or Standard","volume":1,'
        f'"reasoning":"2-3 sentences","uses_remaining":10}}'
    )

    api_key = settings.groq_api_key
    if not api_key:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 800,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        raw = data["choices"][0]["message"]["content"]
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)
        return result

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Groq API error: {e.response.text}")
    except (KeyError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=502, detail=f"Peter AI response error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Peter AI error: {str(e)}")



class PeterRequest(BaseModel):
    symbol: str
    market: str
    live_price: float
    options: Optional[List[str]] = []


@router.post("/analyse")
async def analyse(
    req: PeterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sym_list = (
        "BTC/USD (Crypto, ~68420), ETH/USD (Crypto, ~3821), SOL/USD (Crypto, ~182), "
        "XRP/USD (Crypto, ~0.62), USD/ZAR (Forex, ~18021), EUR/USD (Forex, ~1.08), "
        "GBP/USD (Forex, ~1.27), USD/JPY (Forex, ~149), "
        "APPLE (Stocks, ~189), TESLA (Stocks, ~248), NVIDIA (Stocks, ~875), AMAZON (Stocks, ~182)"
    )

    wants = req.options if req.options else ["a general scalp trade setup"]

    prompt = (
        f"You are Peter, a scalp trading AI assistant. Use ONLY these platform symbols: {sym_list}.\n"
        f"User viewing: {req.symbol} ({req.market}), live price ~{req.live_price:.2f}.\n"
        f"User wants: {', '.join(wants)}.\n"
        f"Set entry VERY close to the symbol base price shown. TP/SL within 0.2-0.8% of entry for scalping.\n"
        f"Return ONLY raw JSON, no markdown:\n"
        f'{{"recommended_symbol":"","recommended_market":"Crypto or Forex or Stocks",'
        f'"direction":"BUY or SELL","strategy":"one sentence","entry":0,"take_profit":0,'
        f'"stop_loss":0,"lot_size":"Macro or Mini or Standard","volume":1,'
        f'"reasoning":"2-3 sentences","uses_remaining":10}}'
    )

    api_key = settings.gemini_api_key
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 800},
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        raw = data["candidates"][0]["content"]["parts"][0]["text"]
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)
        return result

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e.response.text}")
    except (KeyError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=502, detail=f"Peter AI response error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Peter AI error: {str(e)}")