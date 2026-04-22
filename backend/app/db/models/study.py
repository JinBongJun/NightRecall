from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StudyInput(Base):
    __tablename__ = "study_inputs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    input_type: Mapped[str] = mapped_column(String(24))
    raw_content: Mapped[str] = mapped_column(Text)
    source_kind: Mapped[str | None] = mapped_column(String(24), nullable=True)
    source_preview_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_image_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    topics: Mapped[list["StudyTopic"]] = relationship(back_populates="study_input", cascade="all, delete-orphan")


class StudyTopic(Base):
    __tablename__ = "study_topics"
    __table_args__ = (Index("ix_study_topics_user_created", "user_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    study_input_id: Mapped[str] = mapped_column(ForeignKey("study_inputs.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    topic_text: Mapped[str] = mapped_column(String(255))
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    study_input: Mapped[StudyInput] = relationship(back_populates="topics")
