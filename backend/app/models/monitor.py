from __future__ import annotations

import secrets
from uuid import uuid4
from datetime import datetime
import bcrypt

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class Monitor(Base):
    __tablename__ = "monitors"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[Uuid] = mapped_column(ForeignKey("users.id"), index=True)
    url: Mapped[str] = mapped_column(String(2048))
    name: Mapped[str] = mapped_column(String(255))
    interval_seconds: Mapped[int] = mapped_column("interval", Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_maintenance: Mapped[bool] = mapped_column(Boolean, default=False)
    last_status: Mapped[str] = mapped_column(String(32), default="PENDING")
    
    # Monitor type: 'simple' or 'scenario'
    monitor_type: Mapped[str] = mapped_column(String(20), default="simple")
    
    # Scenario steps (for scenario-based monitors)
    # Format: [{"name": "Step 1", "url": "https://...", "order": 1}, ...]
    steps: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=list)
    
    # SSL Certificate fields
    ssl_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ssl_expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ssl_days_remaining: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Domain Expiration fields
    domain_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    domain_expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    domain_days_remaining: Mapped[int | None] = mapped_column(Integer, nullable=True)
    domain_last_checked: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Heartbeat monitoring field
    last_ping_received: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Public sharing fields
    share_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    share_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    share_password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

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

    def generate_share_token(self) -> str:
        """Generate a unique share token for public access"""
        self.share_token = secrets.token_urlsafe(32)
        return self.share_token

    def set_share_password(self, password: str | None) -> None:
        """Set the share password (hashed)"""
        if password:
            salt = bcrypt.gensalt()
            self.share_password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        else:
            self.share_password_hash = None

    def verify_share_password(self, password: str) -> bool:
        """Verify the share password"""
        if not self.share_password_hash:
            return True  # No password set
        return bcrypt.checkpw(password.encode('utf-8'), self.share_password_hash.encode('utf-8'))

    def is_share_expired(self) -> bool:
        """Check if the share link has expired"""
        if not self.share_expires_at:
            return False  # No expiration set
        return datetime.utcnow().replace(tzinfo=self.share_expires_at.tzinfo) > self.share_expires_at
