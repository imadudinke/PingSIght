from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid

from app.db.base import Base


class Monitor(Base):
    __tablename__ = "monitors"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[Uuid] = mapped_column(ForeignKey("users.id"), index=True)
    url: Mapped[str] = mapped_column(String(2048))
    name: Mapped[str] = mapped_column(String(255))
    interval_seconds: Mapped[int] = mapped_column("interval", Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_status: Mapped[str] = mapped_column(String(32), default="PENDING")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="monitors")
    heartbeats: Mapped[list["Heartbeat"]] = relationship(
        "Heartbeat", back_populates="monitor"
    )

    @property
    def interval(self) -> int:
        return self.interval_seconds

    @interval.setter
    def interval(self, value: int) -> None:
        self.interval_seconds = value
