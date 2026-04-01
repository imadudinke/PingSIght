from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.models.monitor import Monitor
from app.models.user import User
from app.schemas.monitor import (
    MonitorCreate, 
    MonitorResponse, 
    MonitorDetailResponse,
    MonitorUpdate, 
    MonitorList,
    MaintenanceModeRequest
)
from app.core.security import get_current_user
from app.services.monitor_service import MonitorService
from app.worker.scheduler import monitor_scheduler

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post("/", response_model=MonitorResponse)
async def create_monitor(
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new monitor (simple or scenario-based) with SSRF protection"""
    
    try:
        # For scenario monitors, check duplicate by name
        if monitor_in.monitor_type == "scenario":
            existing_monitor = await db.execute(
                select(Monitor).where(
                    and_(
                        Monitor.user_id == current_user.id,
                        Monitor.name == monitor_in.friendly_name,
                        Monitor.monitor_type == "scenario"
                    )
                )
            )
            if existing_monitor.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"You already have a scenario monitor with this name: {monitor_in.friendly_name}"
                )
        else:
            # For simple monitors, check duplicate URL
            existing_monitor = await db.execute(
                select(Monitor).where(
                    and_(
                        Monitor.user_id == current_user.id,
                        Monitor.url == str(monitor_in.url)
                    )
                )
            )
            if existing_monitor.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"You already have a monitor for this URL: {monitor_in.url}"
                )
        
        # Prepare steps data for scenario monitors
        steps_data = None
        if monitor_in.monitor_type == "scenario" and monitor_in.steps:
            steps_data = [
                {
                    "name": step.name,
                    "url": str(step.url),
                    "order": step.order,
                    "required_keyword": step.required_keyword  # Include keyword validation
                }
                for step in monitor_in.steps
            ]
        
        # Create the database object
        new_monitor = Monitor(
            url=str(monitor_in.url),
            name=monitor_in.friendly_name,
            interval_seconds=monitor_in.interval_seconds,
            user_id=current_user.id,
            last_status="PENDING",
            is_active=True,
            monitor_type=monitor_in.monitor_type,
            steps=steps_data
        )
        
        # Save to database
        db.add(new_monitor)
        await db.commit()
        await db.refresh(new_monitor)
        
        # Schedule the monitor
        await monitor_scheduler.schedule_monitor(new_monitor)
        
        # Execute initial check
        await monitor_scheduler.execute_monitor_check(new_monitor.id, new_monitor.url)
        
        # Return response with proper field mapping
        return MonitorResponse(
            id=new_monitor.id,
            user_id=new_monitor.user_id,
            url=new_monitor.url,
            friendly_name=new_monitor.name,
            interval_seconds=new_monitor.interval_seconds,
            status=new_monitor.last_status,
            is_active=new_monitor.is_active,
            last_checked=None,
            created_at=new_monitor.created_at,
            monitor_type=new_monitor.monitor_type,
            steps=new_monitor.steps
        )
        
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")


@router.get("/", response_model=MonitorList)
async def list_monitors(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all monitors for the current user with pagination"""
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get monitors for current user
    result = await db.execute(
        select(Monitor)
        .where(Monitor.user_id == current_user.id)
        .offset(offset)
        .limit(per_page)
        .order_by(Monitor.created_at.desc())
    )
    monitors = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(Monitor).where(Monitor.user_id == current_user.id)
    )
    total = len(count_result.scalars().all())
    
    # Convert to response format with last_checked from heartbeats
    monitor_responses = []
    for monitor in monitors:
        # Get latest heartbeat for last_checked
        latest_heartbeat = await MonitorService.get_latest_heartbeat(db, monitor.id)
        last_checked = None
        if latest_heartbeat:
            last_checked = latest_heartbeat.created_at
            # Ensure timezone consistency
            if last_checked.tzinfo is None:
                last_checked = last_checked.replace(tzinfo=timezone.utc)
        
        monitor_responses.append(
            MonitorResponse(
                id=monitor.id,
                user_id=monitor.user_id,
                url=monitor.url,
                friendly_name=monitor.name,
                interval_seconds=monitor.interval_seconds,
                status=monitor.last_status,
                is_active=monitor.is_active,
                last_checked=last_checked,
                created_at=monitor.created_at,
                ssl_status=monitor.ssl_status,
                ssl_expiry_date=monitor.ssl_expiry_date,
                ssl_days_remaining=monitor.ssl_days_remaining,
                monitor_type=monitor.monitor_type,
                steps=monitor.steps
            )
        )
    
    return MonitorList(
        monitors=monitor_responses,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{monitor_id}", response_model=MonitorDetailResponse)
async def get_monitor(
    monitor_id: str,
    include_heartbeats: int = Query(50, ge=0, le=200, description="Number of recent heartbeats to include"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific monitor by ID with heartbeat history and statistics"""
    
    try:
        # Convert string to UUID
        from uuid import UUID
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Get monitor with heartbeats and stats
    result = await MonitorService.get_monitor_with_heartbeats(
        db=db,
        monitor_id=monitor_uuid,
        user_id=current_user.id,
        limit=include_heartbeats
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    monitor, heartbeats, stats = result
    
    # Get latest heartbeat for last_checked
    latest_heartbeat = await MonitorService.get_latest_heartbeat(db, monitor_uuid)
    last_checked = None
    if latest_heartbeat:
        last_checked = latest_heartbeat.created_at
        # Ensure timezone consistency
        if last_checked.tzinfo is None:
            last_checked = last_checked.replace(tzinfo=timezone.utc)
    
    # Convert heartbeats to response format
    heartbeat_responses = MonitorService.heartbeats_to_response(heartbeats)

    return MonitorDetailResponse(
        id=monitor.id,
        user_id=monitor.user_id,
        url=monitor.url,
        friendly_name=monitor.name,
        interval_seconds=monitor.interval_seconds,
        status=monitor.last_status,
        is_active=monitor.is_active,
        last_checked=last_checked,
        created_at=monitor.created_at,
        ssl_status=monitor.ssl_status,
        ssl_expiry_date=monitor.ssl_expiry_date,
        ssl_days_remaining=monitor.ssl_days_remaining,
        monitor_type=monitor.monitor_type,
        steps=monitor.steps,
        recent_heartbeats=heartbeat_responses,
        uptime_percentage=stats.uptime_percentage,
        average_latency=stats.average_latency,
        total_checks=stats.total_checks
    )


@router.put("/{monitor_id}", response_model=MonitorResponse)
async def update_monitor(
    monitor_id: str,
    monitor_update: MonitorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a monitor"""
    
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_id,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Update fields if provided
    update_data = monitor_update.model_dump(exclude_unset=True)
    
    if "friendly_name" in update_data:
        monitor.name = update_data["friendly_name"]
    if "interval_seconds" in update_data:
        monitor.interval_seconds = update_data["interval_seconds"]
    if "is_active" in update_data:
        monitor.is_active = update_data["is_active"]
    if "is_maintenance" in update_data:
        monitor.is_maintenance = update_data["is_maintenance"]
    if "maintenance_until" in update_data:
        monitor.maintenance_until = update_data["maintenance_until"]
    
    try:
        await db.commit()
        await db.refresh(monitor)
        
        return MonitorResponse(
            id=monitor.id,
            user_id=monitor.user_id,
            url=monitor.url,
            friendly_name=monitor.name,
            interval_seconds=monitor.interval_seconds,
            status=monitor.last_status,
            is_active=monitor.is_active,
            last_checked=None,
            created_at=monitor.created_at
        )
        
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")


@router.delete("/{monitor_id}")
async def delete_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a monitor and all associated heartbeats"""
    from uuid import UUID
    from app.models.heartbeat import Heartbeat
    from sqlalchemy import delete as sql_delete
    
    # Convert string to UUID
    try:
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Check if monitor exists and belongs to user
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    try:
        # First, delete all heartbeats associated with this monitor
        await db.execute(
            sql_delete(Heartbeat).where(Heartbeat.monitor_id == monitor_uuid)
        )
        
        # Then delete the monitor
        await db.delete(monitor)
        await db.commit()
        return {"message": "Monitor deleted successfully"}
        
    except SQLAlchemyError as e:
        await db.rollback()
        # Log the actual error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error deleting monitor {monitor_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")

@router.get("/{monitor_id}/stats")
async def get_monitor_stats(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed statistics for a specific monitor"""
    
    try:
        from uuid import UUID
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Verify monitor exists and belongs to user
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Calculate and return statistics
    stats = await MonitorService.calculate_monitor_stats(db, monitor_uuid)
    return stats


@router.get("/{monitor_id}/heartbeats")
async def get_monitor_heartbeats(
    monitor_id: str,
    limit: int = Query(100, ge=1, le=1000, description="Number of heartbeats to return"),
    offset: int = Query(0, ge=0, description="Number of heartbeats to skip"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get heartbeat history for a specific monitor"""
    
    try:
        from uuid import UUID
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Verify monitor exists and belongs to user
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Get heartbeats with pagination
    from sqlalchemy import desc
    from app.models.heartbeat import Heartbeat
    
    heartbeats_result = await db.execute(
        select(Heartbeat)
        .where(Heartbeat.monitor_id == monitor_uuid)
        .order_by(desc(Heartbeat.created_at))
        .offset(offset)
        .limit(limit)
    )
    heartbeats = list(heartbeats_result.scalars().all())
    
    # Get total count
    count_result = await db.execute(
        select(Heartbeat).where(Heartbeat.monitor_id == monitor_uuid)
    )
    total = len(count_result.scalars().all())
    
    # Convert to response format
    heartbeat_responses = MonitorService.heartbeats_to_response(heartbeats)
    
    return {
        "heartbeats": heartbeat_responses,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/{monitor_id}/timing-stats")
async def get_monitor_timing_stats(
    monitor_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (max 1 week)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed timing statistics for a specific monitor"""
    
    try:
        from uuid import UUID
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Verify monitor exists and belongs to user
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Get detailed timing statistics
    timing_stats = await MonitorService.get_detailed_timing_stats(db, monitor_uuid, hours)
    
    return {
        "monitor_id": str(monitor_uuid),
        "monitor_name": monitor.name,
        "url": monitor.url,
        "timing_statistics": timing_stats
    }


# ============================================================
# MAINTENANCE MODE ENDPOINTS
# ============================================================

@router.post("/{monitor_id}/maintenance/enable", response_model=MonitorResponse)
async def enable_maintenance_mode(
    monitor_id: str,
    maintenance_request: Optional[MaintenanceModeRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enable maintenance mode for a monitor.
    
    - Without duration: Manual mode (must disable manually)
    - With duration: Auto-resume after specified minutes
    
    Examples:
    - Manual: POST /monitors/{id}/maintenance/enable (no body)
    - Auto-resume: POST /monitors/{id}/maintenance/enable {"duration_minutes": 120}
    """
    from uuid import UUID
    
    # Convert string to UUID
    try:
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Get monitor
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Calculate maintenance_until if duration provided
    maintenance_until = None
    if maintenance_request and maintenance_request.duration_minutes:
        maintenance_until = datetime.now(timezone.utc) + timedelta(minutes=maintenance_request.duration_minutes)
    
    # Enable maintenance mode
    try:
        monitor.is_maintenance = True
        monitor.maintenance_until = maintenance_until
        
        await db.commit()
        await db.refresh(monitor)
        
        # Log the action
        import logging
        logger = logging.getLogger(__name__)
        if maintenance_until:
            logger.info(
                f"[MAINTENANCE] Enabled for monitor {monitor_id} ({monitor.name}) "
                f"until {maintenance_until.isoformat()}"
            )
        else:
            logger.info(f"[MAINTENANCE] Enabled for monitor {monitor_id} ({monitor.name}) - manual mode")
        
        return MonitorResponse(
            id=monitor.id,
            user_id=monitor.user_id,
            url=monitor.url,
            friendly_name=monitor.name,
            interval_seconds=monitor.interval_seconds,
            status=monitor.last_status,
            is_active=monitor.is_active,
            last_checked=None,  # Not stored in monitor model
            created_at=monitor.created_at,
            monitor_type=monitor.monitor_type,
            steps=monitor.steps,
            ssl_status=monitor.ssl_status,
            ssl_expiry_date=monitor.ssl_expiry_date,
            ssl_days_remaining=monitor.ssl_days_remaining,
            is_maintenance=monitor.is_maintenance,
            maintenance_until=monitor.maintenance_until
        )
        
    except SQLAlchemyError as e:
        await db.rollback()
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error enabling maintenance mode: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")


@router.post("/{monitor_id}/maintenance/disable", response_model=MonitorResponse)
async def disable_maintenance_mode(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Disable maintenance mode and resume monitoring immediately.
    
    This will:
    - Turn off maintenance mode
    - Clear any auto-resume timer
    - Resume monitoring on next scheduled check
    """
    from uuid import UUID
    
    # Convert string to UUID
    try:
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Get monitor
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Check if already not in maintenance
    if not monitor.is_maintenance:
        raise HTTPException(
            status_code=400, 
            detail="Monitor is not in maintenance mode"
        )
    
    # Disable maintenance mode
    try:
        monitor.is_maintenance = False
        monitor.maintenance_until = None
        
        await db.commit()
        await db.refresh(monitor)
        
        # Log the action
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[MAINTENANCE] Disabled for monitor {monitor_id} ({monitor.name}). Monitoring resumed.")
        
        return MonitorResponse(
            id=monitor.id,
            user_id=monitor.user_id,
            url=monitor.url,
            friendly_name=monitor.name,
            interval_seconds=monitor.interval_seconds,
            status=monitor.last_status,
            is_active=monitor.is_active,
            last_checked=None,  # Not stored in monitor model
            created_at=monitor.created_at,
            monitor_type=monitor.monitor_type,
            steps=monitor.steps,
            ssl_status=monitor.ssl_status,
            ssl_expiry_date=monitor.ssl_expiry_date,
            ssl_days_remaining=monitor.ssl_days_remaining,
            is_maintenance=monitor.is_maintenance,
            maintenance_until=monitor.maintenance_until
        )
        
    except SQLAlchemyError as e:
        await db.rollback()
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error disabling maintenance mode: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")


@router.get("/{monitor_id}/maintenance/status")
async def get_maintenance_status(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current maintenance mode status for a monitor.
    
    Returns:
    - is_maintenance: Whether maintenance mode is active
    - maintenance_until: Auto-resume time (if set)
    - time_remaining: Minutes until auto-resume (if applicable)
    """
    from uuid import UUID
    
    # Convert string to UUID
    try:
        monitor_uuid = UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")
    
    # Get monitor
    result = await db.execute(
        select(Monitor).where(
            and_(
                Monitor.id == monitor_uuid,
                Monitor.user_id == current_user.id
            )
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Calculate time remaining
    time_remaining_minutes = None
    if monitor.is_maintenance and monitor.maintenance_until:
        now = datetime.now(timezone.utc)
        if monitor.maintenance_until > now:
            time_remaining = monitor.maintenance_until - now
            time_remaining_minutes = int(time_remaining.total_seconds() / 60)
        else:
            # Maintenance should have expired
            time_remaining_minutes = 0
    
    return {
        "monitor_id": monitor.id,
        "monitor_name": monitor.name,
        "is_maintenance": monitor.is_maintenance,
        "maintenance_until": monitor.maintenance_until,
        "time_remaining_minutes": time_remaining_minutes,
        "mode": "auto-resume" if monitor.maintenance_until else "manual" if monitor.is_maintenance else "active"
    }
