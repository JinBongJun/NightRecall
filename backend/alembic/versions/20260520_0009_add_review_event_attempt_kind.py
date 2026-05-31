"""add review event attempt kind

Revision ID: 20260520_0009
Revises: 20260426_0008
Create Date: 2026-05-20 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260520_0009"
down_revision = "20260426_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("review_events")}
    indexes = {index["name"] for index in inspector.get_indexes("review_events")}

    if "attempt_kind" not in columns:
        op.add_column(
            "review_events",
            sa.Column(
                "attempt_kind",
                sa.String(length=24),
                nullable=False,
                server_default="ritual_main",
            ),
        )

    if "ix_review_events_attempt_kind" not in indexes:
        op.create_index("ix_review_events_attempt_kind", "review_events", ["attempt_kind"])

    if "ix_review_events_user_attempt_answered" not in indexes:
        op.create_index(
            "ix_review_events_user_attempt_answered",
            "review_events",
            ["user_id", "attempt_kind", "answered_at"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("review_events")}
    columns = {column["name"] for column in inspector.get_columns("review_events")}

    if "ix_review_events_user_attempt_answered" in indexes:
        op.drop_index("ix_review_events_user_attempt_answered", table_name="review_events")
    if "ix_review_events_attempt_kind" in indexes:
        op.drop_index("ix_review_events_attempt_kind", table_name="review_events")
    if "attempt_kind" in columns:
        op.drop_column("review_events", "attempt_kind")
