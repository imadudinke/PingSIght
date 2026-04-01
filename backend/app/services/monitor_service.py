from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload

from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.schemas.monitor import MonitorStats, HeartbeatResponse


class MonitorService:
    """Service class for monitor-related business logic"""
    
    @staticmethod
    async def get_monitor_with_heartbeats(
        db: AsyncSession, 
        monitor_id: UUID, 
        user_id: UUID,
        limit: int = 50
    ) -> Optional[Tuple[Monitor, List[Heartbeat], MonitorStats]]:
        """
        Get monitor with recent heartbeats and statistics.
        
        Args:
            db: Database session
            monitor_id: Monitor UUID
            user_id: User UUID for authorization
            limit: Number of recent heartbeats to fetch
            
        Returns:
            Tuple of (Monitor, List[Heartbeat], MonitorStats) or None if not found
        """
        # Get monitor with authorization check
        monitor_result = await db.execute(
            select(Monitor).where(
                and_(
                    Monitor.id == monitor_id,
                    Monitor.user_id == user_id
                )
            )
        )
        monitor = monitor_result.scalar_one_or_none()
        
        if not monitor:
            return None
        
        # Get recent heartbeats
        heartbeats_result = await db.execute(
            select(Heartbeat)
            .where(Heartbeat.monitor_id == monitor_id)
            .order_by(desc(Heartbeat.created_at))
            .limit(limit)
        )
        heartbeats = list(heartbeats_result.scalars().all())
        
        # Calculate statistics
        stats = await MonitorService.calculate_monitor_stats(db, monitor_id)
        
        return monitor, heartbeats, stats
    
    @staticmethod
    async def calculate_monitor_stats(db: AsyncSession, monitor_id: UUID) -> MonitorStats:
        """
        Calculate comprehensive statistics for a monitor.
        
        Args:
            db: Database session
            monitor_id: Monitor UUID
            
        Returns:
            MonitorStats object with calculated statistics
        """
        # Get all heartbeats for this monitor
        all_heartbeats_result = await db.execute(
            select(Heartbeat).where(Heartbeat.monitor_id == monitor_id)
        )
        all_heartbeats = list(all_heartbeats_result.scalars().all())
        
        # Calculate 24-hour window - ensure timezone consistency
        now = datetime.now(timezone.utc)
        twenty_four_hours_ago = now - timedelta(hours=24)
        
        # Filter heartbeats for last 24 hours - handle timezone-naive datetimes
        recent_heartbeats = []
        for hb in all_heartbeats:
            # Convert naive datetime to UTC if needed
            hb_time = hb.created_at
            if hb_time.tzinfo is None:
                hb_time = hb_time.replace(tzinfo=timezone.utc)
            
            if hb_time >= twenty_four_hours_ago:
                recent_heartbeats.append(hb)
        
        # Calculate basic stats
        total_checks = len(all_heartbeats)
        successful_checks = len([hb for hb in all_heartbeats if 200 <= hb.status_code < 400])
        failed_checks = total_checks - successful_checks
        
        # Calculate uptime percentage (all time)
        uptime_percentage = (successful_checks / total_checks * 100) if total_checks > 0 else 0.0
        
        # Calculate average latency (all time, successful checks only)
        successful_latencies = [
            hb.latency_ms for hb in all_heartbeats 
            if 200 <= hb.status_code < 400 and hb.latency_ms > 0
        ]
        average_latency = sum(successful_latencies) / len(successful_latencies) if successful_latencies else 0.0
        
        # Calculate 24-hour stats
        last_24h_checks = len(recent_heartbeats)
        last_24h_successful = len([hb for hb in recent_heartbeats if 200 <= hb.status_code < 400])
        last_24h_uptime = (last_24h_successful / last_24h_checks * 100) if last_24h_checks > 0 else 0.0
        
        return MonitorStats(
            uptime_percentage=round(uptime_percentage, 2),
            average_latency=round(average_latency, 2),
            total_checks=total_checks,
            successful_checks=successful_checks,
            failed_checks=failed_checks,
            last_24h_checks=last_24h_checks,
            last_24h_uptime=round(last_24h_uptime, 2)
        )
    
    @staticmethod
    async def get_latest_heartbeat(db: AsyncSession, monitor_id: UUID) -> Optional[Heartbeat]:
        """
        Get the most recent heartbeat for a monitor.
        
        Args:
            db: Database session
            monitor_id: Monitor UUID
            
        Returns:
            Latest Heartbeat or None
        """
        result = await db.execute(
            select(Heartbeat)
            .where(Heartbeat.monitor_id == monitor_id)
            .order_by(desc(Heartbeat.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    def heartbeats_to_response(heartbeats: List[Heartbeat]) -> List[HeartbeatResponse]:
        """
        Convert Heartbeat models to HeartbeatResponse schemas.
        
        Args:
            heartbeats: List of Heartbeat models
            
        Returns:
            List of HeartbeatResponse schemas
        """
        return [
            HeartbeatResponse(
                id=hb.id,
                status_code=hb.status_code,
                latency_ms=hb.latency_ms,
                tcp_connect_ms=getattr(hb, 'tcp_connect_ms', None),
                tls_handshake_ms=getattr(hb, 'tls_handshake_ms', None),
                ttfb_ms=getattr(hb, 'ttfb_ms', None),
                timing_details=getattr(hb, 'timing_details', None),
                step_results=getattr(hb, 'step_results', None),
                is_anomaly=getattr(hb, 'is_anomaly', False),
                error_message=hb.error_message,
                created_at=hb.created_at.replace(tzinfo=timezone.utc) if hb.created_at.tzinfo is None else hb.created_at
            )
            for hb in heartbeats
        ]
    @staticmethod
    async def get_detailed_timing_stats(db: AsyncSession, monitor_id: UUID, hours: int = 24) -> Dict:
        """
        Get detailed timing statistics for a monitor.
        
        Args:
            db: Database session
            monitor_id: Monitor UUID
            hours: Number of hours to look back
            
        Returns:
            Dict with detailed timing statistics
        """
        # Calculate time window
        now = datetime.now(timezone.utc)
        time_window = now - timedelta(hours=hours)
        
        # Get heartbeats within time window
        result = await db.execute(
            select(Heartbeat)
            .where(
                and_(
                    Heartbeat.monitor_id == monitor_id,
                    Heartbeat.created_at >= time_window
                )
            )
        )
        heartbeats = list(result.scalars().all())
        
        if not heartbeats:
            return {
                "period_hours": hours,
                "total_checks": 0,
                "avg_total_ms": 0,
                "avg_tcp_ms": 0,
                "avg_tls_ms": 0,
                "avg_ttfb_ms": 0,
                "percentiles": {}
            }
        
        # Extract timing data - handle backward compatibility
        total_times = [hb.latency_ms for hb in heartbeats if hb.latency_ms > 0]
        tcp_times = [
            getattr(hb, 'tcp_connect_ms', 0) for hb in heartbeats 
            if hasattr(hb, 'tcp_connect_ms') and getattr(hb, 'tcp_connect_ms', 0) and getattr(hb, 'tcp_connect_ms', 0) > 0
        ]
        tls_times = [
            getattr(hb, 'tls_handshake_ms', 0) for hb in heartbeats 
            if hasattr(hb, 'tls_handshake_ms') and getattr(hb, 'tls_handshake_ms', 0) and getattr(hb, 'tls_handshake_ms', 0) > 0
        ]
        ttfb_times = [
            getattr(hb, 'ttfb_ms', 0) for hb in heartbeats 
            if hasattr(hb, 'ttfb_ms') and getattr(hb, 'ttfb_ms', 0) and getattr(hb, 'ttfb_ms', 0) > 0
        ]
        
        # Calculate averages
        avg_total = sum(total_times) / len(total_times) if total_times else 0
        avg_tcp = sum(tcp_times) / len(tcp_times) if tcp_times else 0
        avg_tls = sum(tls_times) / len(tls_times) if tls_times else 0
        avg_ttfb = sum(ttfb_times) / len(ttfb_times) if ttfb_times else 0
        
        # Calculate percentiles for total time
        percentiles = {}
        if total_times:
            sorted_times = sorted(total_times)
            percentiles = {
                "p50": sorted_times[int(len(sorted_times) * 0.5)],
                "p90": sorted_times[int(len(sorted_times) * 0.9)],
                "p95": sorted_times[int(len(sorted_times) * 0.95)],
                "p99": sorted_times[int(len(sorted_times) * 0.99)] if len(sorted_times) > 10 else sorted_times[-1]
            }
        
        return {
            "period_hours": hours,
            "total_checks": len(heartbeats),
            "avg_total_ms": round(avg_total, 2),
            "avg_tcp_ms": round(avg_tcp, 2),
            "avg_tls_ms": round(avg_tls, 2),
            "avg_ttfb_ms": round(avg_ttfb, 2),
            "percentiles": {k: round(v, 2) for k, v in percentiles.items()}
        }