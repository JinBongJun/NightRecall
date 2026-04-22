from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        Index("ix_questions_user_created", "user_id", "created_at"),
        Index("ix_questions_topic", "study_topic_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    study_input_id: Mapped[str] = mapped_column(ForeignKey("study_inputs.id"), index=True)
    study_topic_id: Mapped[str | None] = mapped_column(ForeignKey("study_topics.id"), nullable=True)
    question_type: Mapped[str] = mapped_column(String(24))
    question_text: Mapped[str] = mapped_column(Text)
    choices_json: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    answer_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    answer_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    explanation: Mapped[str] = mapped_column(String(280))
    source_hash: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)


class QuestionSchedule(Base):
    __tablename__ = "question_schedule"
    __table_args__ = (
        Index("ix_question_schedule_user_due", "user_id", "next_due_at"),
        Index("ix_question_schedule_question", "question_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id"), unique=True)
    priority_type: Mapped[str] = mapped_column(String(24), default="normal")
    next_due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    last_result: Mapped[str | None] = mapped_column(String(24), nullable=True)
    wrong_count: Mapped[int] = mapped_column(Integer, default=0)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
