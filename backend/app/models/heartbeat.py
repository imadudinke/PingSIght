from __future__ import annotations

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Integer, Text, func, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class Heartbeat(Base):
    __tablename__ = "heartbeats"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    monitor_id: Mapped[Uuid] = mapped_column(Uuid, ForeignKey("monitors.id"), index=True)
    status_code: Mapped[int] = mapped_column(Integer)
    latency_ms: Mapped[float] = mapped_column(Float)  # Total latency (sum of all steps for scenarios)
    
    # Detailed timing metrics (for simple monitors)
    tcp_connect_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    tls_handshake_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    ttfb_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Additional metadata as JSON
    timing_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Scenario step results (for scenario monitors)
    # Format: [{"name": "Login", "url": "...", "status": "UP", "status_code": 200, "latency_ms": 150, "error": null}, ...]
    step_results: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), index=True)

    monitor: Mapped["Monitor"] = relationship("Monitor", back_populates="heartbeats")

