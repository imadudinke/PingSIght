import time
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID
from dataclasses import dataclass
import anyio
from urllib.parse import urlparse

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError

# Import your models (Ensure these paths are correct for your project)
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.worker.ssl_checker import get_ssl_info

logger = logging.getLogger(__name__)

@dataclass
class DetailedTimings:
    """Detailed timing metrics for HTTP requests"""
    tcp_ms: float = 0.0
    tls_ms: float = 0.0
    ttfb_ms: float = 0.0
    total_ms: float = 0.0
    dns_ms: float = 0.0
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "tcp_connect_ms": self.tcp_ms,
            "tls_handshake_ms": self.tls_ms,
            "ttfb_ms": self.ttfb_ms,
            "total_ms": self.total_ms,
            "dns_ms": self.dns_ms
        }

async def perform_deep_check(url: str) -> Dict[str, Any]:
    timings = DetailedTimings()
    marks = {}
    
    # AsyncClient expects trace handlers to be async so it can await them before sending/receiving
    async def trace_handler(event_name: str, info: dict):
        now = time.perf_counter()
        
        # 1. TCP Connection (Usually includes DNS lookup)
        if event_name == "connection.connect_tcp.started":
            marks["tcp_start"] = now
        elif event_name == "connection.connect_tcp.complete":
            timings.tcp_ms = round((now - marks.get("tcp_start", now)) * 1000, 2)
        
        # 2. TLS Handshake
        elif event_name == "connection.start_tls.started":
            marks["tls_start"] = now
        elif event_name == "connection.start_tls.complete":
            timings.tls_ms = round((now - marks.get("tls_start", now)) * 1000, 2)
        
        # 3. TTFB (Time to First Byte)
        # Note: We check both http11 and http2 event names
        elif event_name in ["http11.send_request_headers.started", "http2.send_request_headers.started"]:
            marks["req_sent"] = now
        elif event_name in ["http11.receive_response_headers.started", "http2.receive_response_headers.started"]:
            sent_at = marks.get("req_sent", now)
            timings.ttfb_ms = round((now - sent_at) * 1000, 2)

    # CORRECT WAY: Define transport without extensions and pass trace per request
    transport = httpx.AsyncHTTPTransport(
        retries=0
    )

    headers = {
        "User-Agent": "pingSight-Monitor/2.0",
        "Accept": "*/*",
        "Connection": "close"
    }
    
    start_global = time.perf_counter()
    
    try:
        # Pass the transport to the client, NOT event_hooks, and send trace extensions per request
        async with httpx.AsyncClient(
            transport=transport,
            timeout=httpx.Timeout(10.0),
            headers=headers,
            follow_redirects=True
        ) as client:
            
            response = await client.request(
                "GET",
                url,
                extensions={"trace": trace_handler},
            )
            timings.total_ms = round((time.perf_counter() - start_global) * 1000, 2)
            
            status = "UP" if response.is_success else "ISSUE"
            if response.status_code >= 500:
                status = "DOWN"
            
            return {
                "status": status,
                "status_code": response.status_code,
                "timings": timings,
                "metrics": timings.to_dict(),
                "error": None
            }
            
    except Exception as e:
        timings.total_ms = round((time.perf_counter() - start_global) * 1000, 2)
        return {
            "status": "DOWN",
            "status_code": 0,
            "timings": timings,
            "metrics": timings.to_dict(),
            "error": str(e)
        }

async def perform_check(monitor_id: UUID, url: str, db: AsyncSession) -> dict:
    logger.info(f"[PERFORM_CHECK] Starting check for monitor {monitor_id}, URL: {url}")
    check_time = datetime.now(timezone.utc)
    result = await perform_deep_check(url)
    
    timings = result["timings"]
    logger.info(f"[PERFORM_CHECK] Deep check completed. Status: {result['status']}, Total time: {timings.total_ms}ms")
    
    # Check SSL certificate (for HTTPS URLs) - run in thread pool to avoid blocking
    ssl_info = None
    logger.info(f"[SSL_CHECK] Starting SSL check for {url}")
    try:
        import asyncio
        logger.debug(f"[SSL_CHECK] Calling asyncio.to_thread with get_ssl_info")
        ssl_info = await asyncio.to_thread(get_ssl_info, url)
        logger.debug(f"[SSL_CHECK] asyncio.to_thread returned: {ssl_info}")
        
        if ssl_info:
            logger.info(f"[SSL_CHECK] ✓ SSL check successful for {url}: {ssl_info['status']}, {ssl_info['days_remaining']} days remaining, expires: {ssl_info['expiry_date']}")
        else:
            logger.warning(f"[SSL_CHECK] ✗ No SSL info returned for {url} (likely not HTTPS or SSL check failed)")
    except Exception as e:
        logger.error(f"[SSL_CHECK] ✗ SSL check exception for {url}: {str(e)}", exc_info=True)
        ssl_info = None
    
    try:
        # Update Monitor with status and SSL info
        update_values = {"last_status": result["status"]}
        logger.debug(f"[DB_UPDATE] Base update values: {update_values}")
        
        if ssl_info:
            ssl_update = {
                "ssl_status": ssl_info["status"],
                "ssl_expiry_date": ssl_info["expiry_date"],
                "ssl_days_remaining": ssl_info["days_remaining"]
            }
            update_values.update(ssl_update)
            logger.info(f"[DB_UPDATE] Adding SSL data to update: {ssl_update}")
        else:
            logger.warning(f"[DB_UPDATE] No SSL info to update for monitor {monitor_id}")
        
        logger.debug(f"[DB_UPDATE] Final update values: {update_values}")
        await db.execute(
            update(Monitor)
            .where(Monitor.id == monitor_id)
            .values(**update_values)
        )
        logger.info(f"[DB_UPDATE] Monitor {monitor_id} updated successfully")
        
        # Create Heartbeat Record
        new_heartbeat = Heartbeat(
            monitor_id=monitor_id,
            status_code=result["status_code"],
            latency_ms=timings.total_ms,
            tcp_connect_ms=timings.tcp_ms,
            tls_handshake_ms=timings.tls_ms,
            ttfb_ms=timings.ttfb_ms,
            timing_details=result["metrics"], # The JSONB field
            error_message=result["error"],
            created_at=check_time
        )
        
        db.add(new_heartbeat)
        await db.commit()
        logger.info(f"[DB_COMMIT] Heartbeat saved and committed for monitor {monitor_id}")
        
        # Add SSL info to result
        if ssl_info:
            result["ssl"] = {
                "status": ssl_info["status"],
                "days_remaining": ssl_info["days_remaining"],
                "expiry_date": ssl_info["expiry_date"].isoformat()
            }
            logger.debug(f"[RESULT] Added SSL info to result")
        
    except Exception as e:
        await db.rollback()
        logger.error(f"[DB_ERROR] Database error in perform_check for monitor {monitor_id}: {str(e)}", exc_info=True)
    
    logger.info(f"[PERFORM_CHECK] Check completed for monitor {monitor_id}")
    return result


async def get_active_monitors(db: AsyncSession) -> list[Monitor]:
    """Return all currently active monitors to schedule."""
    result = await db.execute(
        select(Monitor).where(Monitor.is_active == True)
    )
    return result.scalars().all()
