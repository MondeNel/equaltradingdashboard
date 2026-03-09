import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OpenTrade(Base):
    __tablename__ = "open_trades"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True   # origin pending order (may be null for instant orders)
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    market: Mapped[str] = mapped_column(String(20), nullable=False)
    trade_type: Mapped[str] = mapped_column(String(10), nullable=False)   # BUY / SELL
    lot_size: Mapped[str] = mapped_column(String(20), nullable=False)
    volume: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_price: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    tp_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    sl_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    margin: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    activated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="open_trades")

    def __repr__(self) -> str:
        return f"<OpenTrade {self.trade_type} {self.symbol} @ {self.entry_price}>"


class TradeHistory(Base):
    __tablename__ = "trade_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    trade_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    market: Mapped[str] = mapped_column(String(20), nullable=False)
    trade_type: Mapped[str] = mapped_column(String(10), nullable=False)
    lot_size: Mapped[str] = mapped_column(String(20), nullable=False)
    volume: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_price: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    close_price: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    tp_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    sl_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    close_reason: Mapped[str] = mapped_column(String(20), nullable=False)  # TP / SL / MANUAL
    pnl: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    pips: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    margin_returned: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="trade_history")

    def __repr__(self) -> str:
        return f"<TradeHistory {self.trade_type} {self.symbol} pnl={self.pnl}>"