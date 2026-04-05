"""
Heartbeat Watcher Worker

This worker implements the "Silence is the Alarm" concept for heartbeat monitors.
It continuously checks if heartbeat monitors have missed their expected pings
and marks them as DOWN, creating incident records.

Core Logic:
- If (now - last_ping_received) > (interval_seconds + grace_period), mark as DOWN
- Creates DOWN heartbeat records for incident tracking
- Runs every 60 seconds to detect missed heartbeats quickly
"""

import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat

logger = logging.getLogger(__name__)

# Grace period in seconds - how long to wait after expected ping before marking DOWN
GRACE_PERIOD_SECONDS = 300  # 5 minutes default grace period


async def check_heartbeat_monitors(db: AsyncSession) -> dict:
    """
    Check all active heartbeat monitors for missed pings.
    
    This is the core "Silence is the Alarm" logic:
    - If a heartbeat monitor hasn't pinged within (interval + grace_period), it's DOWN
    - Creates DOWN heartbeat records for incident tracking
    - Updates monitor status
    
    Args:
        db: Database session
        
    Returns:
        Dict with check statistics
    """
    now = datetime.now(timezone.utc)
    logger.info("[HEARTBEAT_WATCHER] Starting heartbeat monitor check...")
    
    stats = {
        "total_checked": 0,
        "marked_down": 0,
        "still_up": 0,
        "pending": 0,
        "skipped_inactive": 0,
        "skipped_maintenance": 0
    }
    
    try:
        # Get all heartbeat monitors
        result = await db.execute(
            select(Monitor).where(
                Monitor.monitor_type == "heartbeat"
            )
        )
        monitors = result.scalars().all()
        
        logger.info(f"[HEARTBEAT_WATCHER] Found {len(monitors)} heartbeat monitors")
        
        for monitor in monitors:
            # Skip inactive monitors
            if not monitor.is_active:
                stats["skipped_inactive"] += 1
                logger.debug(f"[HEARTBEAT_WATCHER] Skipping inactive monitor {monitor.id} ({monitor.name})")
                continue
            
            # Skip monitors in maintenance mode
            if monitor.is_maintenance:
                stats["skipped_maintenance"] += 1
                logger.debug(f"[HEARTBEAT_WATCHER] Skipping maintenance monitor {monitor.id} ({monitor.name})")
                continue
            
            stats["total_checked"] += 1
            
            # Check if monitor has ever received a ping
            if monitor.last_ping_received is None:
                # Never received a ping - keep as PENDING
                if monitor.last_status != "PENDING":
                    monitor.last_status = "PENDING"
                    logger.info(f"[HEARTBEAT_WATCHER] Monitor {monitor.id} ({monitor.name}) - No pings received yet, status: PENDING")
                stats["pending"] += 1
                continue
            
            # Calculate deadline: last_ping + interval + grace_period
            deadline = monitor.last_ping_received + timedelta(
                seconds=monitor.interval_seconds + GRACE_PERIOD_SECONDS
            )
            
            time_since_last_ping = (now - monitor.last_ping_received).total_seconds()
            time_until_deadline = (deadline - now).total_seconds()
            
            # Check if deadline has passed
            if now > deadline:
                # MISSED HEARTBEAT - Mark as DOWN
                
                # Only create incident record if status was previously UP
                # This prevents creating duplicate DOWN records
                if monitor.last_status == "UP":
                    logger.warning(
                        f"[HEARTBEAT_WATCHER] ⚠️  MISSED HEARTBEAT: Monitor {monitor.id} ({monitor.name}) "
                        f"- Last ping: {time_since_last_ping:.0f}s ago "
                        f"- Expected every: {monitor.interval_seconds}s "
                        f"- Grace period: {GRACE_PERIOD_SECONDS}s "
                        f"- Overdue by: {-time_until_deadline:.0f}s"
                    )
                    
                    # Create DOWN heartbeat record for incident tracking
                    down_heartbeat = Heartbeat(
                        monitor_id=monitor.id,
                        status_code=0,  # 0 indicates no response (silence)
                        latency_ms=0,  # Not applicable
                        tcp_connect_ms=None,
                        tls_handshake_ms=None,
                        ttfb_ms=None,
                        timing_details=None,
                        step_results=None,
                        is_anomaly=False,
                        error_message=f"Heartbeat not received. Last ping: {time_since_last_ping:.0f}s ago (expected every {monitor.interval_seconds}s)",
                        created_at=now
                    )
                    
                    db.add(down_heartbeat)
                    stats["marked_down"] += 1
                    
                    logger.info(
                        f"[HEARTBEAT_WATCHER] Created DOWN incident record for monitor {monitor.id} ({monitor.name})"
                    )
                
                # Update monitor status to DOWN
                monitor.last_status = "DOWN"
                
            else:
                # Still within grace period - Mark as UP
                if monitor.last_status != "UP":
                    logger.info(
                        f"[HEARTBEAT_WATCHER] Monitor {monitor.id} ({monitor.name}) back UP "
                        f"- Last ping: {time_since_last_ping:.0f}s ago "
                        f"- Next deadline in: {time_until_deadline:.0f}s"
                    )
                
                monitor.last_status = "UP"
                stats["still_up"] += 1
        
        # Commit all changes
        await db.commit()
        
        logger.info(
            f"[HEARTBEAT_WATCHER] Check complete - "
            f"Checked: {stats['total_checked']}, "
            f"Marked DOWN: {stats['marked_down']}, "
            f"Still UP: {stats['still_up']}, "
            f"Pending: {stats['pending']}, "
            f"Skipped (inactive): {stats['skipped_inactive']}, "
            f"Skipped (maintenance): {stats['skipped_maintenance']}"
        )
        
        return stats
        
    except Exception as e:
        await db.rollback()
        logger.error(f"[HEARTBEAT_WATCHER] Error checking heartbeat monitors: {str(e)}", exc_info=True)
        return stats


async def get_heartbeat_monitor_stats(db: AsyncSession) -> dict:
    """
    Get statistics about heartbeat monitors for monitoring/debugging.
    
    Args:
        db: Database session
        
    Returns:
        Dict with heartbeat monitor statistics
    """
    try:
        result = await db.execute(
            select(Monitor).where(
                Monitor.monitor_type == "heartbeat"
            )
        )
        monitors = result.scalars().all()
        
        stats = {
            "total": len(monitors),
            "active": sum(1 for m in monitors if m.is_active),
            "inactive": sum(1 for m in monitors if not m.is_active),
            "maintenance": sum(1 for m in monitors if m.is_maintenance),
            "up": sum(1 for m in monitors if m.last_status == "UP" and m.is_active),
            "down": sum(1 for m in monitors if m.last_status == "DOWN" and m.is_active),
            "pending": sum(1 for m in monitors if m.last_status == "PENDING" and m.is_active),
            "never_pinged": sum(1 for m in monitors if m.last_ping_received is None and m.is_active)
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"[HEARTBEAT_WATCHER] Error getting stats: {str(e)}")
        return {}
