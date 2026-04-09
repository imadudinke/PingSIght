"""Status Page Models"""
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class StatusPage(Base):
    __tablename__ = "status_pages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    custom_domain = Column(String(255), nullable=True)
    is_public = Column(Boolean, nullable=False, default=True)
    show_uptime = Column(Boolean, nullable=False, default=True)
    show_incident_history = Column(Boolean, nullable=False, default=True)
    template = Column(String(50), nullable=False, default="minimal", server_default="minimal")
    theme = Column(String(50), nullable=False, default="dark", server_default="dark")
    layout = Column(String(50), nullable=False, default="list", server_default="list")
    branding_logo_url = Column(String(512), nullable=True)
    branding_primary_color = Column(String(7), nullable=True)
    branding_custom_css = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="status_pages")
    components = relationship("StatusPageComponent", back_populates="status_page", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="status_page", cascade="all, delete-orphan")
    maintenances = relationship("ScheduledMaintenance", back_populates="status_page", cascade="all, delete-orphan")
    subscribers = relationship("StatusPageSubscriber", back_populates="status_page", cascade="all, delete-orphan")


class StatusPageComponent(Base):
    __tablename__ = "status_page_components"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_page_id = Column(UUID(as_uuid=True), ForeignKey("status_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    status_page = relationship("StatusPage", back_populates="components")
    component_monitors = relationship("ComponentMonitor", back_populates="component", cascade="all, delete-orphan")
    incident_components = relationship("IncidentComponent", back_populates="component", cascade="all, delete-orphan")
    maintenance_components = relationship("MaintenanceComponent", back_populates="component", cascade="all, delete-orphan")


class ComponentMonitor(Base):
    __tablename__ = "component_monitors"
    __table_args__ = (
        UniqueConstraint('component_id', 'monitor_id', name='uq_component_monitor'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id = Column(UUID(as_uuid=True), ForeignKey("status_page_components.id", ondelete="CASCADE"), nullable=False, index=True)
    monitor_id = Column(UUID(as_uuid=True), ForeignKey("monitors.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    component = relationship("StatusPageComponent", back_populates="component_monitors")
    monitor = relationship("Monitor")


class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_page_id = Column(UUID(as_uuid=True), ForeignKey("status_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, index=True)  # investigating, identified, monitoring, resolved
    severity = Column(String(50), nullable=False)  # minor, major, critical
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    status_page = relationship("StatusPage", back_populates="incidents")
    creator = relationship("User", foreign_keys=[created_by])
    updates = relationship("IncidentUpdate", back_populates="incident", cascade="all, delete-orphan")
    incident_components = relationship("IncidentComponent", back_populates="incident", cascade="all, delete-orphan")


class IncidentUpdate(Base):
    __tablename__ = "incident_updates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    incident = relationship("Incident", back_populates="updates")
    creator = relationship("User", foreign_keys=[created_by])


class IncidentComponent(Base):
    __tablename__ = "incident_components"
    __table_args__ = (
        UniqueConstraint('incident_id', 'component_id', name='uq_incident_component'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id = Column(UUID(as_uuid=True), ForeignKey("status_page_components.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    incident = relationship("Incident", back_populates="incident_components")
    component = relationship("StatusPageComponent", back_populates="incident_components")


class ScheduledMaintenance(Base):
    __tablename__ = "scheduled_maintenances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_page_id = Column(UUID(as_uuid=True), ForeignKey("status_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)  # scheduled, in_progress, completed
    scheduled_start = Column(DateTime(timezone=True), nullable=False, index=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    status_page = relationship("StatusPage", back_populates="maintenances")
    creator = relationship("User", foreign_keys=[created_by])
    maintenance_components = relationship("MaintenanceComponent", back_populates="maintenance", cascade="all, delete-orphan")


class MaintenanceComponent(Base):
    __tablename__ = "maintenance_components"
    __table_args__ = (
        UniqueConstraint('maintenance_id', 'component_id', name='uq_maintenance_component'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    maintenance_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_maintenances.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id = Column(UUID(as_uuid=True), ForeignKey("status_page_components.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    maintenance = relationship("ScheduledMaintenance", back_populates="maintenance_components")
    component = relationship("StatusPageComponent", back_populates="maintenance_components")


class StatusPageSubscriber(Base):
    __tablename__ = "status_page_subscribers"
    __table_args__ = (
        UniqueConstraint('status_page_id', 'email', name='uq_status_page_subscriber'),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status_page_id = Column(UUID(as_uuid=True), ForeignKey("status_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_token = Column(String(64), nullable=True)
    unsubscribe_token = Column(String(64), nullable=False)
    subscribed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    status_page = relationship("StatusPage", back_populates="subscribers")
