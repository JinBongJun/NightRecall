from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OpsEvent(Base):
    __tablename__ = "ops_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    route: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    method: Mapped[str | None] = mapped_column(String(16), nullable=True)

    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user_id_nullable: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    ip_hash_nullable: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    kind: Mapped[str] = mapped_column(String(64), default="http")
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)

