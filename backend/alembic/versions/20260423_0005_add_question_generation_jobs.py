"""add question generation jobs

Revision ID: 20260423_0005
Revises: 20260420_0004
Create Date: 2026-04-23 10:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260423_0005"
down_revision = "20260420_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "question_generation_jobs",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("request_json", sa.Text(), nullable=False),
        sa.Column("result_json", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_question_generation_jobs_user_id", "question_generation_jobs", ["user_id"])
    op.create_index("ix_question_generation_jobs_status", "question_generation_jobs", ["status"])
    op.create_index("ix_question_generation_jobs_created_at", "question_generation_jobs", ["created_at"])
    op.create_index(
        "ix_question_generation_jobs_user_created",
        "question_generation_jobs",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_question_generation_jobs_status_created",
        "question_generation_jobs",
        ["status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_question_generation_jobs_status_created", table_name="question_generation_jobs")
    op.drop_index("ix_question_generation_jobs_user_created", table_name="question_generation_jobs")
    op.drop_index("ix_question_generation_jobs_created_at", table_name="question_generation_jobs")
    op.drop_index("ix_question_generation_jobs_status", table_name="question_generation_jobs")
    op.drop_index("ix_question_generation_jobs_user_id", table_name="question_generation_jobs")
    op.drop_table("question_generation_jobs")
