from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserNotificationSettings(Base):
    __tablename__ = "user_notification_settings"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Discord settings
    discord_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    discord_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Slack settings - now enabled since migration is applied
    slack_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    slack_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Alert preferences
    alert_on_down: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alert_on_recovery: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alert_threshold: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # Alert after N consecutive failures
    
    # SSL/Domain expiry alerts
    ssl_expiry_alert_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    domain_expiry_alert_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notification_settings")
