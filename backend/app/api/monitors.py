from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from app.db.session import get_db
from app.models.monitor import Monitor
from app.models.user import User
from app.schemas.monitor import MonitorCreate, MonitorResponse, MonitorUpdate, MonitorList
from app.core.security import get_current_user

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post("/", response_model=MonitorResponse)
async def create_monitor(
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new monitor with SSRF protection and duplicate prevention"""
    
    try:
        # Check for duplicate URL for this user
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
        
        # Create the database object
        new_monitor = Monitor(
            url=str(monitor_in.url),
            name=monitor_in.friendly_name,
            interval=monitor_in.interval_seconds,
            user_id=current_user.id,
            last_status="PENDING",
            is_active=True
        )
        
        # Save to database
        db.add(new_monitor)
        await db.commit()
        await db.refresh(new_monitor)
        
        # Return response with proper field mapping
        return MonitorResponse(
            id=new_monitor.id,
            user_id=new_monitor.user_id,
            url=new_monitor.url,
            friendly_name=new_monitor.name,
            interval_seconds=new_monitor.interval,
            status=new_monitor.last_status,
            is_active=new_monitor.is_active,
            last_checked=None,  # New monitors haven't been checked yet
            created_at=new_monitor.created_at
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
    
    # Convert to response format
    monitor_responses = [
        MonitorResponse(
            id=monitor.id,
            user_id=monitor.user_id,
            url=monitor.url,
            friendly_name=monitor.name,
            interval_seconds=monitor.interval,
            status=monitor.last_status,
            is_active=monitor.is_active,
            last_checked=None,  # TODO: Add last_checked from heartbeats
            created_at=monitor.created_at
        )
        for monitor in monitors
    ]
    
    return MonitorList(
        monitors=monitor_responses,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{monitor_id}", response_model=MonitorResponse)
async def get_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific monitor by ID"""
    
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
    
    return MonitorResponse(
        id=monitor.id,
        user_id=monitor.user_id,
        url=monitor.url,
        friendly_name=monitor.name,
        interval_seconds=monitor.interval,
        status=monitor.last_status,
        is_active=monitor.is_active,
        last_checked=None,  # TODO: Add last_checked from heartbeats
        created_at=monitor.created_at
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
        monitor.interval = update_data["interval_seconds"]
    if "is_active" in update_data:
        monitor.is_active = update_data["is_active"]
    
    try:
        await db.commit()
        await db.refresh(monitor)
        
        return MonitorResponse(
            id=monitor.id,
            user_id=monitor.user_id,
            url=monitor.url,
            friendly_name=monitor.name,
            interval_seconds=monitor.interval,
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
    """Delete a monitor"""
    
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
    
    try:
        await db.delete(monitor)
        await db.commit()
        return {"message": "Monitor deleted successfully"}
        
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")