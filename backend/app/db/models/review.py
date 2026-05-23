from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.domain.review_attempts import RITUAL_MAIN_ATTEMPT


class ReviewEvent(Base):
    __tablename__ = "review_events"
    __table_args__ = (
        Index("ix_review_events_user_answered", "user_id", "answered_at"),
        Index("ix_review_events_question", "question_id"),
        Index("ix_review_events_user_attempt_answered", "user_id", "attempt_kind", "answered_at"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id"), index=True)
    attempt_kind: Mapped[str] = mapped_column(String(24), default=RITUAL_MAIN_ATTEMPT, index=True)
    selected_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    selected_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
