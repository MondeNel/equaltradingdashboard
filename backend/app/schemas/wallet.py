from decimal import Decimal
from datetime import datetime
import uuid
from pydantic import BaseModel, field_validator


class WalletResponse(BaseModel):
    id: uuid.UUID
    balance: Decimal
    reserved_margin: Decimal
    available_balance: Decimal

    model_config = {"from_attributes": True}


class DepositRequest(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def minimum_deposit(cls, v: Decimal) -> Decimal:
        if v < Decimal("100"):
            raise ValueError("Minimum deposit is ZAR 100")
        return v


class WithdrawRequest(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def minimum_withdraw(cls, v: Decimal) -> Decimal:
        if v < Decimal("100"):
            raise ValueError("Minimum withdrawal is ZAR 100")
        return v


class TransactionResponse(BaseModel):
    id: uuid.UUID
    tx_type: str
    amount: Decimal
    balance_after: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}