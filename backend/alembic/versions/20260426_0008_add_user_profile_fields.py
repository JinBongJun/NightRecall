"""add user profile fields

Revision ID: 20260426_0008
Revises: 20260425_0007
Create Date: 2026-04-26 17:40:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260426_0008"
down_revision = "20260425_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "display_name" not in columns:
        op.add_column("users", sa.Column("display_name", sa.String(length=255), nullable=True))
    if "avatar_url" not in columns:
        op.add_column("users", sa.Column("avatar_url", sa.String(length=1024), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "avatar_url" in columns:
        op.drop_column("users", "avatar_url")
    if "display_name" in columns:
        op.drop_column("users", "display_name")
