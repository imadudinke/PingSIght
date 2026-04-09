from __future__ import annotations

from uuid import uuid4

from sqlalchemy import DateTime, String, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid

from app.db.base import Base


class BlockedEmail(Base):
    __tablename__ = "blocked_emails"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    blocked_by: Mapped[str] = mapped_column(String(255))
    blocked_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

