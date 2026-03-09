import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

PLAN_LIMITS = {
    "FREE": 3,
    "WEEKLY": 5,
    "MONTHLY": -1,   # unlimited
    "YEARLY": -1,    # unlimited
}


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    plan: Mapped[str] = mapped_column(String(20), default="FREE", nullable=False)
    peter_uses_today: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    peter_limit: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    last_reset_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscription")

    @property
    def is_unlimited(self) -> bool:
        return self.peter_limit == -1

    @property
    def can_use_peter(self) -> bool:
        if self.is_unlimited:
            return True
        return self.peter_uses_today < self.peter_limit

    def __repr__(self) -> str:
        return f"<Subscription user={self.user_id} plan={self.plan}>"