"""init nightrecall

Revision ID: 20260413_0001
Revises: 
Create Date: 2026-04-13 14:15:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260413_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("auth_provider", sa.String(length=24), nullable=False),
        sa.Column("email_nullable", sa.String(length=255), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("locale", sa.String(length=12), nullable=False),
        sa.Column("reminder_time", sa.Time(), nullable=True),
        sa.Column("notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "user_identities",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(length=24), nullable=False),
        sa.Column("provider_subject", sa.String(length=255), nullable=False),
        sa.Column("email_nullable", sa.String(length=255), nullable=True),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_identities_user_provider", "user_identities", ["user_id", "provider"])
    op.create_index(
        "ix_user_identities_provider_subject",
        "user_identities",
        ["provider", "provider_subject"],
        unique=True,
    )

    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=255), nullable=False),
        sa.Column("device_label_nullable", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_sessions_user_active", "user_sessions", ["user_id", "revoked_at"])

    op.create_table(
        "study_inputs",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("input_type", sa.String(length=24), nullable=False),
        sa.Column("raw_content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_study_inputs_user_id", "study_inputs", ["user_id"])
    op.create_index("ix_study_inputs_created_at", "study_inputs", ["created_at"])

    op.create_table(
        "study_topics",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("study_input_id", sa.String(length=32), sa.ForeignKey("study_inputs.id"), nullable=False),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("topic_text", sa.String(length=255), nullable=False),
        sa.Column("is_starred", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_study_topics_study_input_id", "study_topics", ["study_input_id"])
    op.create_index("ix_study_topics_user_id", "study_topics", ["user_id"])
    op.create_index("ix_study_topics_created_at", "study_topics", ["created_at"])
    op.create_index("ix_study_topics_user_created", "study_topics", ["user_id", "created_at"])

    op.create_table(
        "questions",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("study_input_id", sa.String(length=32), sa.ForeignKey("study_inputs.id"), nullable=False),
        sa.Column("study_topic_id", sa.String(length=32), sa.ForeignKey("study_topics.id"), nullable=True),
        sa.Column("question_type", sa.String(length=24), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("choices_json", sa.JSON(), nullable=True),
        sa.Column("answer_index", sa.Integer(), nullable=True),
        sa.Column("answer_text", sa.String(length=255), nullable=True),
        sa.Column("explanation", sa.String(length=280), nullable=False),
        sa.Column("source_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_questions_user_id", "questions", ["user_id"])
    op.create_index("ix_questions_study_input_id", "questions", ["study_input_id"])
    op.create_index("ix_questions_source_hash", "questions", ["source_hash"])
    op.create_index("ix_questions_created_at", "questions", ["created_at"])
    op.create_index("ix_questions_user_created", "questions", ["user_id", "created_at"])
    op.create_index("ix_questions_topic", "questions", ["study_topic_id"])

    op.create_table(
        "question_schedule",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("question_id", sa.String(length=32), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("priority_type", sa.String(length=24), nullable=False),
        sa.Column("next_due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_result", sa.String(length=24), nullable=True),
        sa.Column("wrong_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_question_schedule_user_id", "question_schedule", ["user_id"])
    op.create_index("ix_question_schedule_next_due_at", "question_schedule", ["next_due_at"])
    op.create_index("ix_question_schedule_question", "question_schedule", ["question_id"])
    op.create_index("ix_question_schedule_user_due", "question_schedule", ["user_id", "next_due_at"])
    op.create_unique_constraint("uq_question_schedule_question_id", "question_schedule", ["question_id"])

    op.create_table(
        "review_events",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("question_id", sa.String(length=32), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("selected_index", sa.Integer(), nullable=True),
        sa.Column("selected_text", sa.String(length=255), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_review_events_user_id", "review_events", ["user_id"])
    op.create_index("ix_review_events_question_id", "review_events", ["question_id"])
    op.create_index("ix_review_events_answered_at", "review_events", ["answered_at"])
    op.create_index("ix_review_events_user_answered", "review_events", ["user_id", "answered_at"])


def downgrade() -> None:
    op.drop_index("ix_review_events_user_answered", table_name="review_events")
    op.drop_index("ix_review_events_answered_at", table_name="review_events")
    op.drop_index("ix_review_events_question_id", table_name="review_events")
    op.drop_index("ix_review_events_user_id", table_name="review_events")
    op.drop_table("review_events")

    op.drop_constraint("uq_question_schedule_question_id", "question_schedule", type_="unique")
    op.drop_index("ix_question_schedule_user_due", table_name="question_schedule")
    op.drop_index("ix_question_schedule_question", table_name="question_schedule")
    op.drop_index("ix_question_schedule_next_due_at", table_name="question_schedule")
    op.drop_index("ix_question_schedule_user_id", table_name="question_schedule")
    op.drop_table("question_schedule")

    op.drop_index("ix_questions_topic", table_name="questions")
    op.drop_index("ix_questions_user_created", table_name="questions")
    op.drop_index("ix_questions_created_at", table_name="questions")
    op.drop_index("ix_questions_source_hash", table_name="questions")
    op.drop_index("ix_questions_study_input_id", table_name="questions")
    op.drop_index("ix_questions_user_id", table_name="questions")
    op.drop_table("questions")

    op.drop_index("ix_study_topics_user_created", table_name="study_topics")
    op.drop_index("ix_study_topics_created_at", table_name="study_topics")
    op.drop_index("ix_study_topics_user_id", table_name="study_topics")
    op.drop_index("ix_study_topics_study_input_id", table_name="study_topics")
    op.drop_table("study_topics")

    op.drop_index("ix_study_inputs_created_at", table_name="study_inputs")
    op.drop_index("ix_study_inputs_user_id", table_name="study_inputs")
    op.drop_table("study_inputs")

    op.drop_index("ix_user_sessions_user_active", table_name="user_sessions")
    op.drop_table("user_sessions")

    op.drop_index("ix_user_identities_provider_subject", table_name="user_identities")
    op.drop_index("ix_user_identities_user_provider", table_name="user_identities")
    op.drop_table("user_identities")

    op.drop_table("users")
