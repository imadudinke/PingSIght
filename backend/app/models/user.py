from __future__ import annotations

from uuid import uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    monitors: Mapped[list["Monitor"]] = relationship("Monitor", back_populates="user")
    social_accounts: Mapped[list["SocialAccount"]] = relationship(
        "SocialAccount", back_populates="user"
    )
    notification_settings: Mapped["UserNotificationSettings"] = relationship(
        "UserNotificationSettings", back_populates="user", uselist=False
    )
