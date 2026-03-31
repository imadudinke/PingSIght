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
    """Measures DNS resolution and TCP connection time"""
    timings = DetailedTimings()
    marks = {}
    
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname or url.split('/')[0]  # Fallback if no https://
    
    if not hostname:
        return {
            "status": "DOWN",
            "status_code": 0,
            "timings": timings,
            "metrics": timings.to_dict(),
            "error": "Invalid URL"
        }

    # --- PHASE 1: DNS Resolution ---
    dns_start = time.perf_counter()
    try:
        await anyio.getaddrinfo(hostname, None)
        timings.dns_ms = round((time.perf_counter() - dns_start) * 1000, 2)
        logger.info(f"DNS Resolution for {hostname}: {timings.dns_ms}ms")
    except Exception as e:
        # If DNS fails, record how long we waited before it failed
        timings.dns_ms = round((time.perf_counter() - dns_start) * 1000, 2)
        return {
            "status": "DOWN",
            "status_code": 0,
            "timings": timings,
            "metrics": timings.to_dict(),
            "error": f"DNS Resolution Failed: {str(e)}"
        }

    # --- PHASE 2: TCP, TLS, and TTFB ---
    async def trace_handler(event_name: str, info: dict):
        now = time.perf_counter()
        
        # TCP (The physical connection)
        if event_name == "connection.connect_tcp.started":
            marks["tcp_start"] = now
        elif event_name == "connection.connect_tcp.complete":
            timings.tcp_ms = round((now - marks.get("tcp_start", now)) * 1000, 2)
        
        # TLS (The Security/SSL connection)
        elif event_name == "connection.start_tls.started":
            marks["tls_start"] = now
        elif event_name == "connection.start_tls.complete":
            timings.tls_ms = round((now - marks.get("tls_start", now)) * 1000, 2)
        
        # TTFB (Time To First Byte - Server response time)
        elif event_name in ["http11.send_request_headers.started", "http2.send_request_headers.started"]:
            marks["req_sent"] = now
        elif event_name in ["http11.receive_response_headers.started", "http2.receive_response_headers.started"]:
            sent_at = marks.get("req_sent", now)
            timings.ttfb_ms = round((now - sent_at) * 1000, 2)

    # Use the Transport to allow Tracing
    transport = httpx.AsyncHTTPTransport(retries=0)
    
    start_request = time.perf_counter()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=10.0) as client:
            # This actually calls the website
            response = await client.get(url, extensions={"trace": trace_handler})
            
            # Measure how long the WHOLE trip took
            timings.total_ms = round((time.perf_counter() - start_request) * 1000, 2)

            # Logic: Is it actually "UP"?
            # 200-299 = UP, 300-399 = Redirect, 400+ = ISSUE
            status = "UP" if response.is_success else "ISSUE"
            
            return {
                "status": status,
                "status_code": response.status_code,
                "timings": timings,
                "metrics": timings.to_dict(),  # dns_ms and tcp_ms will be here
                "error": None
            }

    except Exception as e:
        timings.total_ms = round((time.perf_counter() - start_request) * 1000, 2)
        return {
            "status": "DOWN",
            "status_code": 0,
            "timings": timings,
            "metrics": timings.to_dict(),
            "error": f"Connection Failed: {str(e)}"
        }

async def perform_check(monitor_id: UUID, url: str, db: AsyncSession) -> dict:
    check_time = datetime.now(timezone.utc)
    result = await perform_deep_check(url)
    
    timings = result["timings"]
    
    # Check SSL certificate (for HTTPS URLs) - run in thread pool to avoid blocking
    ssl_info = None
    try:
        import asyncio
        ssl_info = await asyncio.to_thread(get_ssl_info, url)
        if ssl_info:
            logger.info(f"SSL check successful for {url}: {ssl_info['status']}, {ssl_info['days_remaining']} days")
        else:
            logger.debug(f"No SSL info for {url} (likely not HTTPS)")
    except Exception as e:
        logger.error(f"SSL check failed for {url}: {str(e)}", exc_info=True)
        ssl_info = None
    
    try:
        # Update Monitor with status and SSL info
        update_values = {"last_status": result["status"]}
        
        if ssl_info:
            update_values.update({
                "ssl_status": ssl_info["status"],
                "ssl_expiry_date": ssl_info["expiry_date"],
                "ssl_days_remaining": ssl_info["days_remaining"]
            })
        
        await db.execute(
            update(Monitor)
            .where(Monitor.id == monitor_id)
            .values(**update_values)
        )
        
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
        
        # Add SSL info to result
        if ssl_info:
            result["ssl"] = {
                "status": ssl_info["status"],
                "days_remaining": ssl_info["days_remaining"],
                "expiry_date": ssl_info["expiry_date"].isoformat()
            }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"DB Error in perform_check: {str(e)}", exc_info=True)
    
    return result


async def get_active_monitors(db: AsyncSession) -> list[Monitor]:
    """Return all currently active monitors to schedule."""
    result = await db.execute(
        select(Monitor).where(Monitor.is_active == True)
    )
    return result.scalars().all()
