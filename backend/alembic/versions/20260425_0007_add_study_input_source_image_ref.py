"""add study input source image ref

Revision ID: 20260425_0007
Revises: 20260423_0006
Create Date: 2026-04-25 17:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260425_0007"
down_revision = "20260423_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("study_inputs")}
    indexes = {index["name"] for index in inspector.get_indexes("study_inputs")}
    if "source_image_ref" not in columns:
        op.add_column("study_inputs", sa.Column("source_image_ref", sa.String(length=128), nullable=True))
    if "ix_study_inputs_source_image_ref" not in indexes:
        op.create_index("ix_study_inputs_source_image_ref", "study_inputs", ["source_image_ref"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("study_inputs")}
    indexes = {index["name"] for index in inspector.get_indexes("study_inputs")}
    if "ix_study_inputs_source_image_ref" in indexes:
        op.drop_index("ix_study_inputs_source_image_ref", table_name="study_inputs")
    if "source_image_ref" in columns:
        op.drop_column("study_inputs", "source_image_ref")
