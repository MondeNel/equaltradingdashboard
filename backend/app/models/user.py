import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="user", uselist=False)
    pending_orders: Mapped[list["PendingOrder"]] = relationship("PendingOrder", back_populates="user")
    open_trades: Mapped[list["OpenTrade"]] = relationship("OpenTrade", back_populates="user")
    trade_history: Mapped[list["TradeHistory"]] = relationship("TradeHistory", back_populates="user")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="user")
    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="user", uselist=False)

    def __repr__(self) -> str:
        return f"<User {self.email}>"