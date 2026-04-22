"""add study input source fields

Revision ID: 20260418_0003
Revises: 20260418_0002
Create Date: 2026-04-18 22:15:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260418_0003"
down_revision = "20260418_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("study_inputs", sa.Column("source_kind", sa.String(length=24), nullable=True))
    op.add_column("study_inputs", sa.Column("source_preview_text", sa.Text(), nullable=True))
    op.add_column("study_inputs", sa.Column("source_image_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("study_inputs", "source_image_data")
    op.drop_column("study_inputs", "source_preview_text")
    op.drop_column("study_inputs", "source_kind")
