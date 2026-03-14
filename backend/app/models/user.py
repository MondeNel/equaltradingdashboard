import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    display_name    = Column(String(100), nullable=True)
    country         = Column(String(100), default="South Africa")
    currency_code   = Column(String(10),  default="ZAR")
    currency_symbol = Column(String(5),   default="R")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    subscription   = relationship("Subscription",  back_populates="user", uselist=False)
    wallet         = relationship("Wallet",         back_populates="user", uselist=False)
    pending_orders = relationship("PendingOrder",   back_populates="user")
    open_trades    = relationship("OpenTrade",      back_populates="user")
    trade_history  = relationship("TradeHistory",   back_populates="user")
    transactions   = relationship("Transaction",    back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"
