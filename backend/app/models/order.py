import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PendingOrder(Base):
    __tablename__ = "pending_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    market: Mapped[str] = mapped_column(String(20), nullable=False)       # Forex / Crypto / Stocks
    order_type: Mapped[str] = mapped_column(String(10), nullable=False)   # BUY / SELL
    lot_size: Mapped[str] = mapped_column(String(20), nullable=False)     # Macro / Mini / Standard
    volume: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    entry_price: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    tp_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    sl_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    margin: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="pending_orders")

    def __repr__(self) -> str:
        return f"<PendingOrder {self.order_type} {self.symbol} @ {self.entry_price}>"