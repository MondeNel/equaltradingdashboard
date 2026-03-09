"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "wallets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("balance", sa.Numeric(18, 4), default=0),
        sa.Column("reserved_margin", sa.Numeric(18, 4), default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("plan", sa.String(20), default="FREE"),
        sa.Column("peter_uses_today", sa.Integer, default=0),
        sa.Column("peter_limit", sa.Integer, default=3),
        sa.Column("last_reset_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "pending_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("market", sa.String(20), nullable=False),
        sa.Column("order_type", sa.String(10), nullable=False),
        sa.Column("lot_size", sa.String(20), nullable=False),
        sa.Column("volume", sa.Integer, nullable=False),
        sa.Column("entry_price", sa.Numeric(18, 6), nullable=False),
        sa.Column("tp_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("sl_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("margin", sa.Numeric(18, 4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_pending_orders_user_id", "pending_orders", ["user_id"])

    op.create_table(
        "open_trades",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("order_id", UUID(as_uuid=True), nullable=True),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("market", sa.String(20), nullable=False),
        sa.Column("trade_type", sa.String(10), nullable=False),
        sa.Column("lot_size", sa.String(20), nullable=False),
        sa.Column("volume", sa.Integer, nullable=False),
        sa.Column("entry_price", sa.Numeric(18, 6), nullable=False),
        sa.Column("tp_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("sl_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("margin", sa.Numeric(18, 4), nullable=False),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_open_trades_user_id", "open_trades", ["user_id"])

    op.create_table(
        "trade_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("trade_id", UUID(as_uuid=True), nullable=False),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column("market", sa.String(20), nullable=False),
        sa.Column("trade_type", sa.String(10), nullable=False),
        sa.Column("lot_size", sa.String(20), nullable=False),
        sa.Column("volume", sa.Integer, nullable=False),
        sa.Column("entry_price", sa.Numeric(18, 6), nullable=False),
        sa.Column("close_price", sa.Numeric(18, 6), nullable=False),
        sa.Column("tp_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("sl_price", sa.Numeric(18, 6), nullable=True),
        sa.Column("close_reason", sa.String(20), nullable=False),
        sa.Column("pnl", sa.Numeric(18, 4), nullable=False),
        sa.Column("pips", sa.Numeric(10, 2), nullable=False),
        sa.Column("margin_returned", sa.Numeric(18, 4), nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_trade_history_user_id", "trade_history", ["user_id"])

    op.create_table(
        "transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("tx_type", sa.String(20), nullable=False),
        sa.Column("amount", sa.Numeric(18, 4), nullable=False),
        sa.Column("balance_after", sa.Numeric(18, 4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"])


def downgrade() -> None:
    op.drop_table("transactions")
    op.drop_table("trade_history")
    op.drop_table("open_trades")
    op.drop_table("pending_orders")
    op.drop_table("subscriptions")
    op.drop_table("wallets")
    op.drop_table("users")