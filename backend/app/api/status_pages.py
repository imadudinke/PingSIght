"""Status Pages API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID

from app.db.session import get_db
from app.models.status_page import (
    StatusPage, StatusPageComponent, ComponentMonitor, Incident, IncidentUpdate,
    IncidentComponent, ScheduledMaintenance, MaintenanceComponent, StatusPageSubscriber
)
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.models.user import User
from app.schemas.status_page import (
    StatusPageCreate, StatusPageUpdate, StatusPageResponse,
    ComponentCreate, ComponentUpdate, ComponentResponse, MonitorSummary,
    IncidentCreate, IncidentUpdate as IncidentUpdateSchema, IncidentResponse,
    IncidentUpdateCreate, IncidentUpdateResponse,
    MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse,
    SubscriberCreate, SubscriberResponse,
    PublicStatusPageResponse, UptimeStats, ComponentSummary
)
from app.core.security import get_current_user

router = APIRouter(prefix="/status-pages", tags=["status_pages"])


# ============================================================================
# STATUS PAGE CRUD (Authenticated)
# ============================================================================

@router.post("/", response_model=StatusPageResponse)
async def create_status_page(
    status_page_in: StatusPageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new status page"""
    
    # Check if slug is already taken
    existing = await db.execute(
        select(StatusPage).where(StatusPage.slug == status_page_in.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already taken")
    
    # Extract monitor_ids from input
    monitor_ids = status_page_in.monitor_ids
    status_page_data = status_page_in.model_dump(exclude={'monitor_ids'})
    
    status_page = StatusPage(
        user_id=current_user.id,
        **status_page_data
    )
    
    db.add(status_page)
    await db.flush()  # Get the ID without committing
    
    # If monitors are selected, create a default component and add monitors to it
    if monitor_ids:
        # Verify monitors belong to the user
        result = await db.execute(
            select(Monitor).where(
                and_(
                    Monitor.id.in_(monitor_ids),
                    Monitor.user_id == current_user.id
                )
            )
        )
        user_monitors = result.scalars().all()
        
        if user_monitors:
            # Create a default component
            component = StatusPageComponent(
                status_page_id=status_page.id,
                name="Services",
                description="Main services and components",
                order=0
            )
            db.add(component)
            await db.flush()
            
            # Add monitors to the component
            for monitor in user_monitors:
                component_monitor = ComponentMonitor(
                    component_id=component.id,
                    monitor_id=monitor.id
                )
                db.add(component_monitor)
    
    await db.commit()
    await db.refresh(status_page)
    
    return status_page


@router.get("/", response_model=List[StatusPageResponse])
async def list_status_pages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all status pages for the current user"""
    
    result = await db.execute(
        select(StatusPage)
        .where(StatusPage.user_id == current_user.id)
        .order_by(StatusPage.created_at.desc())
    )
    status_pages = result.scalars().all()
    
    return status_pages


@router.get("/{status_page_id}", response_model=StatusPageResponse)
async def get_status_page(
    status_page_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific status page"""
    
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    status_page = result.scalar_one_or_none()
    
    if not status_page:
        raise HTTPException(status_code=404, detail="Status page not found")
    
    return status_page


@router.put("/{status_page_id}", response_model=StatusPageResponse)
async def update_status_page(
    status_page_id: UUID,
    status_page_update: StatusPageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a status page"""
    
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    status_page = result.scalar_one_or_none()
    
    if not status_page:
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Update fields
    update_data = status_page_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(status_page, field, value)
    
    status_page.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(status_page)
    
    return status_page


@router.delete("/{status_page_id}")
async def delete_status_page(
    status_page_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a status page"""
    
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    status_page = result.scalar_one_or_none()
    
    if not status_page:
        raise HTTPException(status_code=404, detail="Status page not found")
    
    await db.delete(status_page)
    await db.commit()
    
    return {"message": "Status page deleted successfully"}


# ============================================================================
# COMPONENTS (Authenticated)
# ============================================================================

@router.post("/{status_page_id}/components", response_model=ComponentResponse)
async def create_component(
    status_page_id: UUID,
    component_in: ComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new component on a status page"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    status_page = result.scalar_one_or_none()
    
    if not status_page:
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Create component
    component = StatusPageComponent(
        status_page_id=status_page_id,
        name=component_in.name,
        description=component_in.description,
        order=component_in.order
    )
    
    db.add(component)
    await db.flush()
    
    # Add monitors to component
    for monitor_id in component_in.monitor_ids:
        # Verify monitor belongs to user
        monitor_result = await db.execute(
            select(Monitor).where(
                and_(
                    Monitor.id == monitor_id,
                    Monitor.user_id == current_user.id
                )
            )
        )
        if not monitor_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Monitor {monitor_id} not found")
        
        component_monitor = ComponentMonitor(
            component_id=component.id,
            monitor_id=monitor_id
        )
        db.add(component_monitor)
    
    await db.commit()
    await db.refresh(component)
    
    # Load monitors for response
    result = await db.execute(
        select(StatusPageComponent)
        .options(selectinload(StatusPageComponent.component_monitors))
        .where(StatusPageComponent.id == component.id)
    )
    component = result.scalar_one()
    
    # Get monitor details
    monitors = []
    for cm in component.component_monitors:
        monitor_result = await db.execute(
            select(Monitor).where(Monitor.id == cm.monitor_id)
        )
        monitor = monitor_result.scalar_one()
        monitors.append(MonitorSummary(
            id=monitor.id,
            friendly_name=monitor.name,
            status=monitor.last_status,
            monitor_type=monitor.monitor_type
        ))
    
    # Determine component status
    current_status = _determine_component_status(monitors)
    
    return ComponentResponse(
        id=component.id,
        status_page_id=component.status_page_id,
        name=component.name,
        description=component.description,
        order=component.order,
        created_at=component.created_at,
        monitors=monitors,
        current_status=current_status
    )


@router.get("/{status_page_id}/components", response_model=List[ComponentResponse])
async def list_components(
    status_page_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all components for a status page"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    status_page = result.scalar_one_or_none()
    
    if not status_page:
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get components with monitors
    result = await db.execute(
        select(StatusPageComponent)
        .options(selectinload(StatusPageComponent.component_monitors))
        .where(StatusPageComponent.status_page_id == status_page_id)
        .order_by(StatusPageComponent.order)
    )
    components = result.scalars().all()
    
    response = []
    for component in components:
        monitors = []
        for cm in component.component_monitors:
            monitor_result = await db.execute(
                select(Monitor).where(Monitor.id == cm.monitor_id)
            )
            monitor = monitor_result.scalar_one()
            monitors.append(MonitorSummary(
                id=monitor.id,
                friendly_name=monitor.name,
                status=monitor.last_status,
                monitor_type=monitor.monitor_type
            ))
        
        current_status = _determine_component_status(monitors)
        
        response.append(ComponentResponse(
            id=component.id,
            status_page_id=component.status_page_id,
            name=component.name,
            description=component.description,
            order=component.order,
            created_at=component.created_at,
            monitors=monitors,
            current_status=current_status
        ))
    
    return response


@router.put("/{status_page_id}/components/{component_id}", response_model=ComponentResponse)
async def update_component(
    status_page_id: UUID,
    component_id: UUID,
    component_update: ComponentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a component"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get component
    result = await db.execute(
        select(StatusPageComponent).where(
            and_(
                StatusPageComponent.id == component_id,
                StatusPageComponent.status_page_id == status_page_id
            )
        )
    )
    component = result.scalar_one_or_none()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Update basic fields
    update_data = component_update.model_dump(exclude_unset=True, exclude={'monitor_ids'})
    for field, value in update_data.items():
        setattr(component, field, value)
    
    # Update monitors if provided
    if component_update.monitor_ids is not None:
        # Remove existing monitors
        await db.execute(
            select(ComponentMonitor).where(ComponentMonitor.component_id == component_id)
        )
        existing_cms = (await db.execute(
            select(ComponentMonitor).where(ComponentMonitor.component_id == component_id)
        )).scalars().all()
        
        for cm in existing_cms:
            await db.delete(cm)
        
        # Add new monitors
        for monitor_id in component_update.monitor_ids:
            monitor_result = await db.execute(
                select(Monitor).where(
                    and_(
                        Monitor.id == monitor_id,
                        Monitor.user_id == current_user.id
                    )
                )
            )
            if not monitor_result.scalar_one_or_none():
                raise HTTPException(status_code=404, detail=f"Monitor {monitor_id} not found")
            
            component_monitor = ComponentMonitor(
                component_id=component.id,
                monitor_id=monitor_id
            )
            db.add(component_monitor)
    
    await db.commit()
    await db.refresh(component)
    
    # Load monitors for response
    result = await db.execute(
        select(StatusPageComponent)
        .options(selectinload(StatusPageComponent.component_monitors))
        .where(StatusPageComponent.id == component.id)
    )
    component = result.scalar_one()
    
    monitors = []
    for cm in component.component_monitors:
        monitor_result = await db.execute(
            select(Monitor).where(Monitor.id == cm.monitor_id)
        )
        monitor = monitor_result.scalar_one()
        monitors.append(MonitorSummary(
            id=monitor.id,
            friendly_name=monitor.name,
            status=monitor.last_status,
            monitor_type=monitor.monitor_type
        ))
    
    current_status = _determine_component_status(monitors)
    
    return ComponentResponse(
        id=component.id,
        status_page_id=component.status_page_id,
        name=component.name,
        description=component.description,
        order=component.order,
        created_at=component.created_at,
        monitors=monitors,
        current_status=current_status
    )


@router.delete("/{status_page_id}/components/{component_id}")
async def delete_component(
    status_page_id: UUID,
    component_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a component"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get component
    result = await db.execute(
        select(StatusPageComponent).where(
            and_(
                StatusPageComponent.id == component_id,
                StatusPageComponent.status_page_id == status_page_id
            )
        )
    )
    component = result.scalar_one_or_none()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    await db.delete(component)
    await db.commit()
    
    return {"message": "Component deleted successfully"}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _determine_component_status(monitors: List[MonitorSummary]) -> str:
    """Determine overall component status from monitors"""
    if not monitors:
        return "operational"
    
    down_count = sum(1 for m in monitors if m.status == "DOWN")
    issue_count = sum(1 for m in monitors if m.status == "ISSUE")
    
    if down_count == len(monitors):
        return "major_outage"
    elif down_count > 0:
        return "partial_outage"
    elif issue_count > 0:
        return "degraded_performance"
    else:
        return "operational"



# ============================================================================
# INCIDENTS (Authenticated)
# ============================================================================

@router.post("/{status_page_id}/incidents", response_model=IncidentResponse)
async def create_incident(
    status_page_id: UUID,
    incident_in: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new incident"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Create incident
    incident = Incident(
        status_page_id=status_page_id,
        title=incident_in.title,
        description=incident_in.description,
        status=incident_in.status,
        severity=incident_in.severity,
        started_at=datetime.now(timezone.utc),
        created_by=current_user.id
    )
    
    db.add(incident)
    await db.flush()
    
    # Add affected components
    for component_id in incident_in.component_ids:
        incident_component = IncidentComponent(
            incident_id=incident.id,
            component_id=component_id
        )
        db.add(incident_component)
    
    # Create initial update
    initial_update = IncidentUpdate(
        incident_id=incident.id,
        status=incident_in.status,
        message=incident_in.description or "Incident created",
        created_by=current_user.id
    )
    db.add(initial_update)
    
    await db.commit()
    await db.refresh(incident)
    
    # Load full incident with relationships
    return await _get_incident_response(db, incident.id)


@router.get("/{status_page_id}/incidents", response_model=List[IncidentResponse])
async def list_incidents(
    status_page_id: UUID,
    status: Optional[str] = Query(None, pattern=r'^(investigating|identified|monitoring|resolved)$'),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List incidents for a status page"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Build query
    query = select(Incident).where(Incident.status_page_id == status_page_id)
    
    if status:
        query = query.where(Incident.status == status)
    
    query = query.order_by(Incident.started_at.desc()).limit(limit)
    
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    # Build responses
    responses = []
    for incident in incidents:
        responses.append(await _get_incident_response(db, incident.id))
    
    return responses


@router.get("/{status_page_id}/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    status_page_id: UUID,
    incident_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific incident"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get incident
    result = await db.execute(
        select(Incident).where(
            and_(
                Incident.id == incident_id,
                Incident.status_page_id == status_page_id
            )
        )
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return await _get_incident_response(db, incident.id)


@router.put("/{status_page_id}/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    status_page_id: UUID,
    incident_id: UUID,
    incident_update: IncidentUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an incident"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get incident
    result = await db.execute(
        select(Incident).where(
            and_(
                Incident.id == incident_id,
                Incident.status_page_id == status_page_id
            )
        )
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Update fields
    update_data = incident_update.model_dump(exclude_unset=True, exclude={'component_ids'})
    for field, value in update_data.items():
        setattr(incident, field, value)
    
    # Mark as resolved if status is resolved
    if incident_update.status == "resolved" and not incident.resolved_at:
        incident.resolved_at = datetime.now(timezone.utc)
    
    incident.updated_at = datetime.now(timezone.utc)
    
    # Update components if provided
    if incident_update.component_ids is not None:
        # Remove existing
        existing = (await db.execute(
            select(IncidentComponent).where(IncidentComponent.incident_id == incident_id)
        )).scalars().all()
        
        for ic in existing:
            await db.delete(ic)
        
        # Add new
        for component_id in incident_update.component_ids:
            incident_component = IncidentComponent(
                incident_id=incident.id,
                component_id=component_id
            )
            db.add(incident_component)
    
    await db.commit()
    await db.refresh(incident)
    
    return await _get_incident_response(db, incident.id)


@router.post("/{status_page_id}/incidents/{incident_id}/updates", response_model=IncidentUpdateResponse)
async def add_incident_update(
    status_page_id: UUID,
    incident_id: UUID,
    update_in: IncidentUpdateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an update to an incident"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get incident
    result = await db.execute(
        select(Incident).where(
            and_(
                Incident.id == incident_id,
                Incident.status_page_id == status_page_id
            )
        )
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Create update
    incident_update = IncidentUpdate(
        incident_id=incident_id,
        status=update_in.status,
        message=update_in.message,
        created_by=current_user.id
    )
    
    db.add(incident_update)
    
    # Update incident status
    incident.status = update_in.status
    incident.updated_at = datetime.now(timezone.utc)
    
    # Mark as resolved if status is resolved
    if update_in.status == "resolved" and not incident.resolved_at:
        incident.resolved_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(incident_update)
    
    return incident_update


@router.delete("/{status_page_id}/incidents/{incident_id}")
async def delete_incident(
    status_page_id: UUID,
    incident_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an incident"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get incident
    result = await db.execute(
        select(Incident).where(
            and_(
                Incident.id == incident_id,
                Incident.status_page_id == status_page_id
            )
        )
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    await db.delete(incident)
    await db.commit()
    
    return {"message": "Incident deleted successfully"}


# ============================================================================
# SCHEDULED MAINTENANCES (Authenticated)
# ============================================================================

@router.post("/{status_page_id}/maintenances", response_model=MaintenanceResponse)
async def create_maintenance(
    status_page_id: UUID,
    maintenance_in: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a scheduled maintenance"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Validate dates
    if maintenance_in.scheduled_end <= maintenance_in.scheduled_start:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Create maintenance
    maintenance = ScheduledMaintenance(
        status_page_id=status_page_id,
        title=maintenance_in.title,
        description=maintenance_in.description,
        status="scheduled",
        scheduled_start=maintenance_in.scheduled_start,
        scheduled_end=maintenance_in.scheduled_end,
        created_by=current_user.id
    )
    
    db.add(maintenance)
    await db.flush()
    
    # Add affected components
    for component_id in maintenance_in.component_ids:
        maintenance_component = MaintenanceComponent(
            maintenance_id=maintenance.id,
            component_id=component_id
        )
        db.add(maintenance_component)
    
    await db.commit()
    await db.refresh(maintenance)
    
    return await _get_maintenance_response(db, maintenance.id)


@router.get("/{status_page_id}/maintenances", response_model=List[MaintenanceResponse])
async def list_maintenances(
    status_page_id: UUID,
    status: Optional[str] = Query(None, pattern=r'^(scheduled|in_progress|completed)$'),
    upcoming_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List scheduled maintenances"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Build query
    query = select(ScheduledMaintenance).where(ScheduledMaintenance.status_page_id == status_page_id)
    
    if status:
        query = query.where(ScheduledMaintenance.status == status)
    
    if upcoming_only:
        query = query.where(ScheduledMaintenance.scheduled_start > datetime.now(timezone.utc))
    
    query = query.order_by(ScheduledMaintenance.scheduled_start.desc())
    
    result = await db.execute(query)
    maintenances = result.scalars().all()
    
    responses = []
    for maintenance in maintenances:
        responses.append(await _get_maintenance_response(db, maintenance.id))
    
    return responses


@router.put("/{status_page_id}/maintenances/{maintenance_id}", response_model=MaintenanceResponse)
async def update_maintenance(
    status_page_id: UUID,
    maintenance_id: UUID,
    maintenance_update: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a scheduled maintenance"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get maintenance
    result = await db.execute(
        select(ScheduledMaintenance).where(
            and_(
                ScheduledMaintenance.id == maintenance_id,
                ScheduledMaintenance.status_page_id == status_page_id
            )
        )
    )
    maintenance = result.scalar_one_or_none()
    
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    
    # Update fields
    update_data = maintenance_update.model_dump(exclude_unset=True, exclude={'component_ids'})
    for field, value in update_data.items():
        setattr(maintenance, field, value)
    
    maintenance.updated_at = datetime.now(timezone.utc)
    
    # Update components if provided
    if maintenance_update.component_ids is not None:
        # Remove existing
        existing = (await db.execute(
            select(MaintenanceComponent).where(MaintenanceComponent.maintenance_id == maintenance_id)
        )).scalars().all()
        
        for mc in existing:
            await db.delete(mc)
        
        # Add new
        for component_id in maintenance_update.component_ids:
            maintenance_component = MaintenanceComponent(
                maintenance_id=maintenance.id,
                component_id=component_id
            )
            db.add(maintenance_component)
    
    await db.commit()
    await db.refresh(maintenance)
    
    return await _get_maintenance_response(db, maintenance.id)


@router.delete("/{status_page_id}/maintenances/{maintenance_id}")
async def delete_maintenance(
    status_page_id: UUID,
    maintenance_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scheduled maintenance"""
    
    # Verify status page ownership
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.id == status_page_id,
                StatusPage.user_id == current_user.id
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get maintenance
    result = await db.execute(
        select(ScheduledMaintenance).where(
            and_(
                ScheduledMaintenance.id == maintenance_id,
                ScheduledMaintenance.status_page_id == status_page_id
            )
        )
    )
    maintenance = result.scalar_one_or_none()
    
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    
    await db.delete(maintenance)
    await db.commit()
    
    return {"message": "Maintenance deleted successfully"}


# ============================================================================
# PUBLIC STATUS PAGE (No Authentication Required)
# ============================================================================

@router.get("/public/{slug}", response_model=PublicStatusPageResponse)
async def get_public_status_page(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get public status page by slug (no authentication required)"""
    
    # Get status page
    result = await db.execute(
        select(StatusPage).where(
            and_(
                StatusPage.slug == slug,
                StatusPage.is_public == True
            )
        )
    )
    status_page = result.scalar_one_or_none()
    
    if not status_page:
        raise HTTPException(status_code=404, detail="Status page not found")
    
    # Get components with monitors
    components_result = await db.execute(
        select(StatusPageComponent)
        .options(selectinload(StatusPageComponent.component_monitors))
        .where(StatusPageComponent.status_page_id == status_page.id)
        .order_by(StatusPageComponent.order)
    )
    components = components_result.scalars().all()
    
    component_responses = []
    overall_status = "operational"
    
    for component in components:
        monitors = []
        for cm in component.component_monitors:
            monitor_result = await db.execute(
                select(Monitor).where(Monitor.id == cm.monitor_id)
            )
            monitor = monitor_result.scalar_one()
            monitors.append(MonitorSummary(
                id=monitor.id,
                friendly_name=monitor.name,
                status=monitor.last_status,
                monitor_type=monitor.monitor_type
            ))
        
        current_status = _determine_component_status(monitors)
        
        # Update overall status
        if current_status == "major_outage":
            overall_status = "outage"
        elif current_status in ["partial_outage", "degraded_performance"] and overall_status == "operational":
            overall_status = "degraded"
        
        component_responses.append(ComponentResponse(
            id=component.id,
            status_page_id=component.status_page_id,
            name=component.name,
            description=component.description,
            order=component.order,
            created_at=component.created_at,
            monitors=monitors,
            current_status=current_status
        ))
    
    # Get active incidents (not resolved)
    incidents_result = await db.execute(
        select(Incident)
        .where(
            and_(
                Incident.status_page_id == status_page.id,
                Incident.status != "resolved"
            )
        )
        .order_by(Incident.started_at.desc())
        .limit(10)
    )
    active_incidents = incidents_result.scalars().all()
    
    incident_responses = []
    for incident in active_incidents:
        incident_responses.append(await _get_incident_response(db, incident.id))
    
    # Get upcoming maintenances
    maintenances_result = await db.execute(
        select(ScheduledMaintenance)
        .where(
            and_(
                ScheduledMaintenance.status_page_id == status_page.id,
                ScheduledMaintenance.scheduled_start > datetime.now(timezone.utc),
                ScheduledMaintenance.status.in_(["scheduled", "in_progress"])
            )
        )
        .order_by(ScheduledMaintenance.scheduled_start)
        .limit(5)
    )
    upcoming_maintenances = maintenances_result.scalars().all()
    
    maintenance_responses = []
    for maintenance in upcoming_maintenances:
        maintenance_responses.append(await _get_maintenance_response(db, maintenance.id))
    
    return PublicStatusPageResponse(
        name=status_page.name,
        description=status_page.description,
        slug=status_page.slug,
        show_uptime=status_page.show_uptime,
        show_incident_history=status_page.show_incident_history,
        template=status_page.template,
        theme=status_page.theme,
        layout=status_page.layout,
        branding_logo_url=status_page.branding_logo_url,
        branding_primary_color=status_page.branding_primary_color,
        branding_custom_css=status_page.branding_custom_css,
        components=component_responses,
        active_incidents=incident_responses,
        upcoming_maintenances=maintenance_responses,
        overall_status=overall_status
    )


# ============================================================================
# HELPER FUNCTIONS FOR RESPONSES
# ============================================================================

async def _get_incident_response(db: AsyncSession, incident_id: UUID) -> IncidentResponse:
    """Get full incident response with updates and components"""
    
    # Get incident with updates
    result = await db.execute(
        select(Incident)
        .options(selectinload(Incident.updates))
        .where(Incident.id == incident_id)
    )
    incident = result.scalar_one()
    
    # Get components
    components_result = await db.execute(
        select(IncidentComponent)
        .where(IncidentComponent.incident_id == incident_id)
    )
    incident_components = components_result.scalars().all()
    
    components = []
    for ic in incident_components:
        component_result = await db.execute(
            select(StatusPageComponent).where(StatusPageComponent.id == ic.component_id)
        )
        component = component_result.scalar_one()
        components.append(ComponentSummary(
            id=component.id,
            name=component.name
        ))
    
    return IncidentResponse(
        id=incident.id,
        status_page_id=incident.status_page_id,
        title=incident.title,
        description=incident.description,
        status=incident.status,
        severity=incident.severity,
        started_at=incident.started_at,
        resolved_at=incident.resolved_at,
        created_by=incident.created_by,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        updates=[IncidentUpdateResponse(
            id=u.id,
            incident_id=u.incident_id,
            status=u.status,
            message=u.message,
            created_by=u.created_by,
            created_at=u.created_at
        ) for u in incident.updates],
        components=components
    )


async def _get_maintenance_response(db: AsyncSession, maintenance_id: UUID) -> MaintenanceResponse:
    """Get full maintenance response with components"""
    
    # Get maintenance
    result = await db.execute(
        select(ScheduledMaintenance).where(ScheduledMaintenance.id == maintenance_id)
    )
    maintenance = result.scalar_one()
    
    # Get components
    components_result = await db.execute(
        select(MaintenanceComponent)
        .where(MaintenanceComponent.maintenance_id == maintenance_id)
    )
    maintenance_components = components_result.scalars().all()
    
    components = []
    for mc in maintenance_components:
        component_result = await db.execute(
            select(StatusPageComponent).where(StatusPageComponent.id == mc.component_id)
        )
        component = component_result.scalar_one()
        components.append(ComponentSummary(
            id=component.id,
            name=component.name
        ))
    
    return MaintenanceResponse(
        id=maintenance.id,
        status_page_id=maintenance.status_page_id,
        title=maintenance.title,
        description=maintenance.description,
        status=maintenance.status,
        scheduled_start=maintenance.scheduled_start,
        scheduled_end=maintenance.scheduled_end,
        actual_start=maintenance.actual_start,
        actual_end=maintenance.actual_end,
        created_by=maintenance.created_by,
        created_at=maintenance.created_at,
        updated_at=maintenance.updated_at,
        components=components
    )
