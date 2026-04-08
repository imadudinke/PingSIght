"""
Data export API endpoints for monitors and heartbeats.
"""
import csv
import io
import json
from datetime import datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.models.user import User

router = APIRouter(prefix="/export", tags=["export"])


async def _get_monitor_with_heartbeats(
    monitor_id: UUID,
    user_id: UUID,
    db: AsyncSession,
    days: int = 30,
):
    """Fetch monitor and its heartbeats for export."""
    # Verify monitor ownership
    result = await db.execute(
        select(Monitor).where(
            and_(Monitor.id == monitor_id, Monitor.user_id == user_id)
        )
    )
    monitor = result.scalar_one_or_none()
    
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    # Fetch heartbeats within date range
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Heartbeat)
        .where(
            and_(
                Heartbeat.monitor_id == monitor_id,
                Heartbeat.created_at >= cutoff_date
            )
        )
        .order_by(Heartbeat.created_at.desc())
    )
    heartbeats = result.scalars().all()
    
    return monitor, heartbeats


def _generate_csv_export(monitor: Monitor, heartbeats: list[Heartbeat]) -> str:
    """Generate CSV export of monitor data."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Monitor metadata section
    writer.writerow(["MONITOR INFORMATION"])
    writer.writerow(["Field", "Value"])
    writer.writerow(["Monitor ID", str(monitor.id)])
    writer.writerow(["Name", monitor.name])
    writer.writerow(["Type", monitor.monitor_type])
    writer.writerow(["URL", monitor.url])
    writer.writerow(["Status", monitor.last_status])
    writer.writerow(["Interval (seconds)", monitor.interval_seconds])
    writer.writerow(["Active", "Yes" if monitor.is_active else "No"])
    writer.writerow(["Maintenance Mode", "Yes" if monitor.is_maintenance else "No"])
    writer.writerow(["Created At", monitor.created_at.isoformat() if monitor.created_at else ""])
    
    # SSL information (if available)
    if monitor.ssl_status:
        writer.writerow([])
        writer.writerow(["SSL CERTIFICATE"])
        writer.writerow(["Status", monitor.ssl_status])
        writer.writerow(["Expiry Date", monitor.ssl_expiry_date.isoformat() if monitor.ssl_expiry_date else ""])
        writer.writerow(["Days Remaining", monitor.ssl_days_remaining or ""])
    
    # Domain information (if available)
    if monitor.domain_status:
        writer.writerow([])
        writer.writerow(["DOMAIN EXPIRATION"])
        writer.writerow(["Status", monitor.domain_status])
        writer.writerow(["Expiry Date", monitor.domain_expiry_date.isoformat() if monitor.domain_expiry_date else ""])
        writer.writerow(["Days Remaining", monitor.domain_days_remaining or ""])
    
    # Heartbeat data section
    writer.writerow([])
    writer.writerow(["HEARTBEAT DATA"])
    
    if monitor.monitor_type == "heartbeat":
        writer.writerow([
            "Timestamp",
            "Status Code",
            "Error Message"
        ])
        for hb in heartbeats:
            writer.writerow([
                hb.created_at.isoformat() if hb.created_at else "",
                hb.status_code,
                hb.error_message or ""
            ])
    else:
        writer.writerow([
            "Timestamp",
            "Status Code",
            "Latency (ms)",
            "TCP Connect (ms)",
            "TLS Handshake (ms)",
            "TTFB (ms)",
            "Is Anomaly",
            "Error Message"
        ])
        for hb in heartbeats:
            writer.writerow([
                hb.created_at.isoformat() if hb.created_at else "",
                hb.status_code,
                hb.latency_ms,
                hb.tcp_connect_ms or "",
                hb.tls_handshake_ms or "",
                hb.ttfb_ms or "",
                "Yes" if hb.is_anomaly else "No",
                hb.error_message or ""
            ])
    
    return output.getvalue()


def _generate_json_export(monitor: Monitor, heartbeats: list[Heartbeat]) -> dict:
    """Generate JSON export of monitor data."""
    return {
        "export_metadata": {
            "exported_at": datetime.utcnow().isoformat(),
            "format_version": "1.0"
        },
        "monitor": {
            "id": str(monitor.id),
            "name": monitor.name,
            "type": monitor.monitor_type,
            "url": monitor.url,
            "status": monitor.last_status,
            "interval_seconds": monitor.interval_seconds,
            "is_active": monitor.is_active,
            "is_maintenance": monitor.is_maintenance,
            "created_at": monitor.created_at.isoformat() if monitor.created_at else None,
            "ssl": {
                "status": monitor.ssl_status,
                "expiry_date": monitor.ssl_expiry_date.isoformat() if monitor.ssl_expiry_date else None,
                "days_remaining": monitor.ssl_days_remaining
            } if monitor.ssl_status else None,
            "domain": {
                "status": monitor.domain_status,
                "expiry_date": monitor.domain_expiry_date.isoformat() if monitor.domain_expiry_date else None,
                "days_remaining": monitor.domain_days_remaining
            } if monitor.domain_status else None,
            "steps": monitor.steps if monitor.monitor_type == "scenario" else None
        },
        "heartbeats": [
            {
                "id": hb.id,
                "timestamp": hb.created_at.isoformat() if hb.created_at else None,
                "status_code": hb.status_code,
                "latency_ms": hb.latency_ms,
                "tcp_connect_ms": hb.tcp_connect_ms,
                "tls_handshake_ms": hb.tls_handshake_ms,
                "ttfb_ms": hb.ttfb_ms,
                "is_anomaly": hb.is_anomaly,
                "error_message": hb.error_message,
                "step_results": hb.step_results if monitor.monitor_type == "scenario" else None
            }
            for hb in heartbeats
        ],
        "statistics": {
            "total_heartbeats": len(heartbeats),
            "successful_checks": sum(1 for hb in heartbeats if hb.status_code < 400),
            "failed_checks": sum(1 for hb in heartbeats if hb.status_code >= 400),
            "average_latency_ms": sum(hb.latency_ms for hb in heartbeats) / len(heartbeats) if heartbeats else 0,
            "anomalies_detected": sum(1 for hb in heartbeats if hb.is_anomaly)
        }
    }


@router.get("/monitors/{monitor_id}")
async def export_monitor_data(
    monitor_id: UUID,
    format: Literal["csv", "json"] = Query("csv", description="Export format"),
    days: int = Query(30, ge=1, le=365, description="Number of days to export"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export monitor data including heartbeats and statistics.
    
    Supports CSV and JSON formats.
    """
    monitor, heartbeats = await _get_monitor_with_heartbeats(
        monitor_id, current_user.id, db, days
    )
    
    if format == "csv":
        csv_data = _generate_csv_export(monitor, heartbeats)
        filename = f"monitor_{monitor.name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.StringIO(csv_data),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # json
        json_data = _generate_json_export(monitor, heartbeats)
        filename = f"monitor_{monitor.name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        return StreamingResponse(
            io.StringIO(json.dumps(json_data, indent=2)),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )


@router.get("/monitors/bulk")
async def export_all_monitors(
    format: Literal["csv", "json"] = Query("json", description="Export format"),
    days: int = Query(30, ge=1, le=365, description="Number of days to export"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export all monitors for the current user.
    
    CSV format exports each monitor separately in sections.
    JSON format exports all monitors in a structured format.
    """
    # Fetch all user monitors
    result = await db.execute(
        select(Monitor).where(Monitor.user_id == current_user.id)
    )
    monitors = result.scalars().all()
    
    if not monitors:
        raise HTTPException(status_code=404, detail="No monitors found")
    
    if format == "json":
        # Export all monitors as JSON
        all_data = {
            "export_metadata": {
                "exported_at": datetime.utcnow().isoformat(),
                "format_version": "1.0",
                "user_id": str(current_user.id),
                "total_monitors": len(monitors)
            },
            "monitors": []
        }
        
        for monitor in monitors:
            _, heartbeats = await _get_monitor_with_heartbeats(
                monitor.id, current_user.id, db, days
            )
            monitor_data = _generate_json_export(monitor, heartbeats)
            all_data["monitors"].append(monitor_data)
        
        filename = f"all_monitors_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        return StreamingResponse(
            io.StringIO(json.dumps(all_data, indent=2)),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # csv
        # Export all monitors as CSV (concatenated)
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["BULK MONITOR EXPORT"])
        writer.writerow(["Exported At", datetime.utcnow().isoformat()])
        writer.writerow(["Total Monitors", len(monitors)])
        writer.writerow([])
        
        for idx, monitor in enumerate(monitors, 1):
            _, heartbeats = await _get_monitor_with_heartbeats(
                monitor.id, current_user.id, db, days
            )
            
            writer.writerow([f"=== MONITOR {idx} OF {len(monitors)} ==="])
            writer.writerow([])
            
            # Write monitor data
            csv_content = _generate_csv_export(monitor, heartbeats)
            output.write(csv_content)
            
            writer.writerow([])
            writer.writerow(["=" * 50])
            writer.writerow([])
        
        filename = f"all_monitors_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
