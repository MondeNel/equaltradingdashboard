import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

PLAN_LIMITS = {
    "FREE":    3,
    "WEEKLY":  5,
    "MONTHLY": None,
    "YEARLY":  None,
}

class Subscription(Base):
    __tablename__ = "subscriptions"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan             = Column(String, default="FREE", nullable=False)
    peter_limit      = Column(Integer, nullable=True, default=3)
    peter_uses_today = Column(Integer, default=0, nullable=False)
    started_at       = Column(DateTime(timezone=True), nullable=True)
    expires_at       = Column(DateTime(timezone=True), nullable=True)
    created_at       = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at       = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")

    @property
    def can_use_peter(self) -> bool:
        if self.peter_limit is None:
            return True
        return self.peter_uses_today < self.peter_limit
