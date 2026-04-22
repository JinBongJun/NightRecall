"""add waitlist signups

Revision ID: 20260418_0002
Revises: 20260413_0001
Create Date: 2026-04-18 02:30:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260418_0002"
down_revision = "20260413_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "waitlist_signups",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("source_nullable", sa.String(length=64), nullable=True),
        sa.Column("signup_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_signup_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_waitlist_signups_email", "waitlist_signups", ["email"], unique=True)
    op.create_index("ix_waitlist_signups_last_signup_at", "waitlist_signups", ["last_signup_at"])


def downgrade() -> None:
    op.drop_index("ix_waitlist_signups_last_signup_at", table_name="waitlist_signups")
    op.drop_index("ix_waitlist_signups_email", table_name="waitlist_signups")
    op.drop_table("waitlist_signups")
