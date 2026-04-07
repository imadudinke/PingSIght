"""Pydantic schemas for Status Pages"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr


# Status Page Schemas
class StatusPageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    custom_domain: Optional[str] = None
    is_public: bool = True
    show_uptime: bool = True
    show_incident_history: bool = True
    template: str = Field(default="minimal", pattern=r'^(minimal|modern|corporate|gaming)$')
    theme: str = Field(default="dark", pattern=r'^(dark|light|auto)$')
    layout: str = Field(default="list", pattern=r'^(list|grid|compact)$')
    branding_logo_url: Optional[str] = None
    branding_primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    branding_custom_css: Optional[str] = None
    monitor_ids: List[UUID] = []  # Monitors to include in this status page


class StatusPageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    custom_domain: Optional[str] = None
    is_public: Optional[bool] = None
    show_uptime: Optional[bool] = None
    show_incident_history: Optional[bool] = None
    template: Optional[str] = Field(None, pattern=r'^(minimal|modern|corporate|gaming)$')
    theme: Optional[str] = Field(None, pattern=r'^(dark|light|auto)$')
    layout: Optional[str] = Field(None, pattern=r'^(list|grid|compact)$')
    branding_logo_url: Optional[str] = None
    branding_primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    branding_custom_css: Optional[str] = None


class StatusPageResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    slug: str
    description: Optional[str]
    custom_domain: Optional[str]
    is_public: bool
    show_uptime: bool
    show_incident_history: bool
    template: str
    theme: str
    layout: str
    branding_logo_url: Optional[str]
    branding_primary_color: Optional[str]
    branding_custom_css: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Component Schemas
class ComponentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order: int = 0
    monitor_ids: List[UUID] = []


class ComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    order: Optional[int] = None
    monitor_ids: Optional[List[UUID]] = None


class MonitorSummary(BaseModel):
    id: UUID
    friendly_name: str
    status: str
    monitor_type: str


class ComponentResponse(BaseModel):
    id: UUID
    status_page_id: UUID
    name: str
    description: Optional[str]
    order: int
    created_at: datetime
    monitors: List[MonitorSummary] = []
    current_status: str = "operational"  # operational, degraded_performance, partial_outage, major_outage

    class Config:
        from_attributes = True


# Incident Schemas
class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(..., pattern=r'^(investigating|identified|monitoring|resolved)$')
    severity: str = Field(..., pattern=r'^(minor|major|critical)$')
    component_ids: List[UUID] = []


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r'^(investigating|identified|monitoring|resolved)$')
    severity: Optional[str] = Field(None, pattern=r'^(minor|major|critical)$')
    component_ids: Optional[List[UUID]] = None


class IncidentUpdateCreate(BaseModel):
    status: str = Field(..., pattern=r'^(investigating|identified|monitoring|resolved)$')
    message: str = Field(..., min_length=1)


class IncidentUpdateResponse(BaseModel):
    id: UUID
    incident_id: UUID
    status: str
    message: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ComponentSummary(BaseModel):
    id: UUID
    name: str


class IncidentResponse(BaseModel):
    id: UUID
    status_page_id: UUID
    title: str
    description: Optional[str]
    status: str
    severity: str
    started_at: datetime
    resolved_at: Optional[datetime]
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    updates: List[IncidentUpdateResponse] = []
    components: List[ComponentSummary] = []

    class Config:
        from_attributes = True


# Scheduled Maintenance Schemas
class MaintenanceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: datetime
    component_ids: List[UUID] = []


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r'^(scheduled|in_progress|completed)$')
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    component_ids: Optional[List[UUID]] = None


class MaintenanceResponse(BaseModel):
    id: UUID
    status_page_id: UUID
    title: str
    description: Optional[str]
    status: str
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime]
    actual_end: Optional[datetime]
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    components: List[ComponentSummary] = []

    class Config:
        from_attributes = True


# Subscriber Schemas
class SubscriberCreate(BaseModel):
    email: EmailStr


class SubscriberResponse(BaseModel):
    id: UUID
    status_page_id: UUID
    email: str
    is_verified: bool
    subscribed_at: datetime
    verified_at: Optional[datetime]

    class Config:
        from_attributes = True


# Public Status Page View (for non-authenticated users)
class PublicStatusPageResponse(BaseModel):
    name: str
    description: Optional[str]
    slug: str
    show_uptime: bool
    show_incident_history: bool
    template: str
    theme: str
    layout: str
    branding_logo_url: Optional[str]
    branding_primary_color: Optional[str]
    branding_custom_css: Optional[str]
    components: List[ComponentResponse] = []
    active_incidents: List[IncidentResponse] = []
    upcoming_maintenances: List[MaintenanceResponse] = []
    overall_status: str = "operational"  # operational, degraded, outage

    class Config:
        from_attributes = True


# Uptime Statistics
class UptimeStats(BaseModel):
    component_id: UUID
    component_name: str
    uptime_percentage_24h: float
    uptime_percentage_7d: float
    uptime_percentage_30d: float
    uptime_percentage_90d: float
