"""Status Page models for public status pages and incident management"""
from __future__ import annotations

import secrets
from uuid import uuid4
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid

from app.db.base import Base


class StatusPage(Base):
    """Public status page for displaying service status"""
    __tablename__ = "status_pages"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[Uuid] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    show_uptime: Mapped[bool] = mapped_column(Boolean, default=True)
    show_incident_history: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Branding and Templates
    template: Mapped[str] = mapped_column(String(50), default="minimal")  # minimal, modern, corporate, gaming
    theme: Mapped[str] = mapped_column(String(50), default="dark")  # dark, light, auto
    layout: Mapped[str] = mapped_column(String(50), default="list")  # list, grid, compact
    branding_logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    branding_primary_color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    branding_custom_css: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="status_pages")
    components: Mapped[list["StatusPageComponent"]] = relationship(
        "StatusPageComponent", back_populates="status_page", cascade="all, delete-orphan"
    )
    incidents: Mapped[list["Incident"]] = relationship(
        "Incident", back_populates="status_page", cascade="all, delete-orphan"
    )
    maintenances: Mapped[list["ScheduledMaintenance"]] = relationship(
        "ScheduledMaintenance", back_populates="status_page", cascade="all, delete-orphan"
    )
    subscribers: Mapped[list["StatusPageSubscriber"]] = relationship(
        "StatusPageSubscriber", back_populates="status_page", cascade="all, delete-orphan"
    )


class StatusPageComponent(Base):
    """Component/service group on a status page"""
    __tablename__ = "status_page_components"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    status_page_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_pages.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    status_page: Mapped["StatusPage"] = relationship("StatusPage", back_populates="components")
    component_monitors: Mapped[list["ComponentMonitor"]] = relationship(
        "ComponentMonitor", back_populates="component", cascade="all, delete-orphan"
    )
    incident_components: Mapped[list["IncidentComponent"]] = relationship(
        "IncidentComponent", back_populates="component", cascade="all, delete-orphan"
    )
    maintenance_components: Mapped[list["MaintenanceComponent"]] = relationship(
        "MaintenanceComponent", back_populates="component", cascade="all, delete-orphan"
    )


class ComponentMonitor(Base):
    """Many-to-many relationship between components and monitors"""
    __tablename__ = "component_monitors"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    component_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_page_components.id", ondelete="CASCADE"), index=True
    )
    monitor_id: Mapped[Uuid] = mapped_column(
        ForeignKey("monitors.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    component: Mapped["StatusPageComponent"] = relationship("StatusPageComponent", back_populates="component_monitors")
    monitor: Mapped["Monitor"] = relationship("Monitor")


class Incident(Base):
    """Incident on a status page"""
    __tablename__ = "incidents"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    status_page_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_pages.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), index=True)  # investigating, identified, monitoring, resolved
    severity: Mapped[str] = mapped_column(String(50))  # minor, major, critical
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Uuid] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    status_page: Mapped["StatusPage"] = relationship("StatusPage", back_populates="incidents")
    creator: Mapped["User"] = relationship("User")
    updates: Mapped[list["IncidentUpdate"]] = relationship(
        "IncidentUpdate", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentUpdate.created_at.desc()"
    )
    incident_components: Mapped[list["IncidentComponent"]] = relationship(
        "IncidentComponent", back_populates="incident", cascade="all, delete-orphan"
    )


class IncidentUpdate(Base):
    """Timeline update for an incident"""
    __tablename__ = "incident_updates"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    incident_id: Mapped[Uuid] = mapped_column(
        ForeignKey("incidents.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text)
    created_by: Mapped[Uuid] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    # Relationships
    incident: Mapped["Incident"] = relationship("Incident", back_populates="updates")
    creator: Mapped["User"] = relationship("User")


class IncidentComponent(Base):
    """Many-to-many relationship between incidents and components"""
    __tablename__ = "incident_components"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    incident_id: Mapped[Uuid] = mapped_column(
        ForeignKey("incidents.id", ondelete="CASCADE"), index=True
    )
    component_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_page_components.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    incident: Mapped["Incident"] = relationship("Incident", back_populates="incident_components")
    component: Mapped["StatusPageComponent"] = relationship("StatusPageComponent", back_populates="incident_components")


class ScheduledMaintenance(Base):
    """Scheduled maintenance window"""
    __tablename__ = "scheduled_maintenances"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    status_page_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_pages.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50))  # scheduled, in_progress, completed
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Uuid] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    status_page: Mapped["StatusPage"] = relationship("StatusPage", back_populates="maintenances")
    creator: Mapped["User"] = relationship("User")
    maintenance_components: Mapped[list["MaintenanceComponent"]] = relationship(
        "MaintenanceComponent", back_populates="maintenance", cascade="all, delete-orphan"
    )


class MaintenanceComponent(Base):
    """Many-to-many relationship between maintenances and components"""
    __tablename__ = "maintenance_components"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    maintenance_id: Mapped[Uuid] = mapped_column(
        ForeignKey("scheduled_maintenances.id", ondelete="CASCADE"), index=True
    )
    component_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_page_components.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    maintenance: Mapped["ScheduledMaintenance"] = relationship("ScheduledMaintenance", back_populates="maintenance_components")
    component: Mapped["StatusPageComponent"] = relationship("StatusPageComponent", back_populates="maintenance_components")


class StatusPageSubscriber(Base):
    """Email subscriber for status page updates"""
    __tablename__ = "status_page_subscribers"

    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4)
    status_page_id: Mapped[Uuid] = mapped_column(
        ForeignKey("status_pages.id", ondelete="CASCADE"), index=True
    )
    email: Mapped[str] = mapped_column(String(255), index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    unsubscribe_token: Mapped[str] = mapped_column(String(64), default=lambda: secrets.token_urlsafe(32))
    subscribed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    status_page: Mapped["StatusPage"] = relationship("StatusPage", back_populates="subscribers")

    def generate_verification_token(self) -> str:
        """Generate a verification token"""
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token
