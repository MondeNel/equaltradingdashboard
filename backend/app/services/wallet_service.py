from decimal import Decimal
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.trade import OpenTrade


async def get_or_create_wallet(user_id: uuid.UUID, db: AsyncSession) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        await db.flush()
    return wallet


async def deposit(user_id: uuid.UUID, amount: Decimal, db: AsyncSession) -> Wallet:
    wallet = await get_or_create_wallet(user_id, db)
    wallet.balance += amount
    tx = Transaction(
        user_id=user_id,
        tx_type="DEPOSIT",
        amount=amount,
        balance_after=wallet.balance,
    )
    db.add(tx)
    await db.flush()
    return wallet


async def withdraw(user_id: uuid.UUID, amount: Decimal, db: AsyncSession) -> Wallet:
    wallet = await get_or_create_wallet(user_id, db)

    # Block withdrawal if open trades exist
    trades_result = await db.execute(
        select(OpenTrade).where(OpenTrade.user_id == user_id).limit(1)
    )
    if trades_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot withdraw while you have open positions. Close all trades first.",
        )

    if amount > wallet.available_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available balance. Available: ZAR {wallet.available_balance:.2f}",
        )

    wallet.balance -= amount
    tx = Transaction(
        user_id=user_id,
        tx_type="WITHDRAW",
        amount=amount,
        balance_after=wallet.balance,
    )
    db.add(tx)
    await db.flush()
    return wallet


async def reserve_margin(user_id: uuid.UUID, margin: Decimal, db: AsyncSession) -> Wallet:
    wallet = await get_or_create_wallet(user_id, db)

    if wallet.available_balance < margin:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient balance. Need ZAR {margin:.2f}, available ZAR {wallet.available_balance:.2f}",
        )

    wallet.reserved_margin += margin
    await db.flush()
    return wallet


async def release_margin(user_id: uuid.UUID, margin: Decimal, pnl: Decimal, db: AsyncSession) -> Wallet:
    wallet = await get_or_create_wallet(user_id, db)
    wallet.reserved_margin = max(Decimal("0"), wallet.reserved_margin - margin)
    wallet.balance += pnl  # pnl can be negative (loss)
    await db.flush()
    return wallet