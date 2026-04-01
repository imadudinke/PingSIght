from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.schemas.monitor import HeartbeatReceiveResponse

router = APIRouter(prefix="/heartbeats", tags=["heartbeats"])


async def _handle_heartbeat_ping(
    monitor_id: UUID,
    db: AsyncSession,
) -> HeartbeatReceiveResponse:
    """Persist an incoming heartbeat ping and update monitor state."""
    current_time = datetime.now(timezone.utc)

    # Fetch and validate monitor
    result = await db.execute(
        select(Monitor).where(Monitor.id == monitor_id)
    )
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    if monitor.monitor_type != "heartbeat":
        raise HTTPException(
            status_code=400,
            detail="Monitor is not a heartbeat monitor"
        )

    if not monitor.is_active:
        raise HTTPException(status_code=409, detail="Monitor is inactive")

    if monitor.is_maintenance:
        raise HTTPException(status_code=409, detail="Monitor is in maintenance mode")

    # Update monitor state
    monitor.last_ping_received = current_time
    monitor.last_status = "UP"

    # Create heartbeat record
    heartbeat = Heartbeat(
        monitor_id=monitor_id,
        status_code=200,
        latency_ms=0,  # Not applicable for heartbeat monitors
        error_message=None,
        created_at=current_time
    )

    db.add(heartbeat)
    await db.commit()

    # Calculate next expected ping time
    next_expected = current_time + timedelta(seconds=monitor.interval_seconds)

    return HeartbeatReceiveResponse(
        success=True,
        message="Heartbeat received",
        monitor_id=monitor_id,
        received_at=current_time,
        next_expected_at=next_expected
    )


@router.post("/{monitor_id}", response_model=HeartbeatReceiveResponse)
async def receive_heartbeat(
    monitor_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> HeartbeatReceiveResponse:
    """
    Receive a heartbeat ping from an external service.

    This endpoint does not require user authentication - only the monitor ID is needed.
    The monitor ID acts as a secret token for authentication.
    """
    return await _handle_heartbeat_ping(monitor_id, db)


@router.get("/{monitor_id}", response_model=HeartbeatReceiveResponse)
async def receive_heartbeat_get(
    monitor_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> HeartbeatReceiveResponse:
    """
    Receive a heartbeat ping from an external service via GET request.
    
    This endpoint provides the same functionality as the POST endpoint but uses GET,
    making it simpler for shell scripts and curl commands that don't need to send a body.
    
    This endpoint does not require user authentication - only the monitor ID is needed.
    The monitor ID acts as a secret token for authentication.
    
    Args:
        monitor_id: UUID of the heartbeat monitor
        db: Database session
        
    Returns:
        HeartbeatReceiveResponse with success status and next expected ping time
        
    Raises:
        HTTPException 404: Monitor not found
        HTTPException 400: Monitor is not a heartbeat type
    """
    return await _handle_heartbeat_ping(monitor_id, db)
