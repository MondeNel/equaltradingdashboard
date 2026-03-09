from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.wallet import DepositRequest, WalletResponse, WithdrawRequest, TransactionResponse
from app.services.wallet_service import deposit, get_or_create_wallet, withdraw

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_or_create_wallet(current_user.id, db)
    return WalletResponse(
        id=wallet.id,
        balance=wallet.balance,
        reserved_margin=wallet.reserved_margin,
        available_balance=wallet.available_balance,
    )


@router.post("/deposit", response_model=WalletResponse)
async def deposit_funds(
    req: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await deposit(current_user.id, req.amount, db)
    return WalletResponse(
        id=wallet.id,
        balance=wallet.balance,
        reserved_margin=wallet.reserved_margin,
        available_balance=wallet.available_balance,
    )


@router.post("/withdraw", response_model=WalletResponse)
async def withdraw_funds(
    req: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await withdraw(current_user.id, req.amount, db)
    return WalletResponse(
        id=wallet.id,
        balance=wallet.balance,
        reserved_margin=wallet.reserved_margin,
        available_balance=wallet.available_balance,
    )


@router.get("/history", response_model=list[TransactionResponse])
async def transaction_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    )
    return list(result.scalars().all())