"""add study input extract jobs

Revision ID: 20260423_0006
Revises: 20260423_0005
Create Date: 2026-04-23 00:06:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260423_0006"
down_revision = "20260423_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "study_input_extract_jobs",
        sa.Column("id", sa.String(length=32), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_study_input_extract_jobs_user_id", "study_input_extract_jobs", ["user_id"])
    op.create_index("ix_study_input_extract_jobs_status", "study_input_extract_jobs", ["status"])
    op.create_index("ix_study_input_extract_jobs_created_at", "study_input_extract_jobs", ["created_at"])
    op.create_index(
        "ix_study_input_extract_jobs_user_created",
        "study_input_extract_jobs",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_study_input_extract_jobs_status_created",
        "study_input_extract_jobs",
        ["status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_study_input_extract_jobs_status_created", table_name="study_input_extract_jobs")
    op.drop_index("ix_study_input_extract_jobs_user_created", table_name="study_input_extract_jobs")
    op.drop_index("ix_study_input_extract_jobs_created_at", table_name="study_input_extract_jobs")
    op.drop_index("ix_study_input_extract_jobs_status", table_name="study_input_extract_jobs")
    op.drop_index("ix_study_input_extract_jobs_user_id", table_name="study_input_extract_jobs")
    op.drop_table("study_input_extract_jobs")
