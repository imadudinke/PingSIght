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

async def perform_scenario_check(steps: list[dict], db: AsyncSession) -> dict:
    """
    Perform checks for all steps in a scenario monitor with detailed timing.
    Runs every 4-5 minutes (separate from main URL check).
    
    Args:
        steps: List of steps [{"name": "...", "url": "...", "order": 1}, ...]
        db: Database session
        
    Returns:
        Dict with aggregated results and individual step results with detailed timing
    """
    logger.info(f"[SCENARIO_CHECK] Starting scenario check with {len(steps)} steps")
    
    step_results = []
    total_latency = 0.0
    all_successful = True
    overall_status_code = 200
    failed_step = None
    failure_reason = None
    
    # Sort steps by order
    sorted_steps = sorted(steps, key=lambda x: x['order'])
    
    for step in sorted_steps:
        step_name = step['name']
        step_url = step['url']
        step_order = step['order']
        logger.info(f"[SCENARIO_CHECK] Checking step {step_order}: {step_name} - {step_url}")
        
        # Create timing object for this step
        step_timings = {
            "dns_ms": 0.0,
            "tcp_ms": 0.0,
            "tls_ms": 0.0,
            "ttfb_ms": 0.0,
            "total_ms": 0.0
        }
        marks = {}
        
        # Trace handler for this specific step
        async def trace_handler(event_name: str, info: dict):
            now = time.perf_counter()
            
            # TCP Connection
            if event_name == "connection.connect_tcp.started":
                marks["tcp_start"] = now
            elif event_name == "connection.connect_tcp.complete":
                step_timings["tcp_ms"] = round((now - marks.get("tcp_start", now)) * 1000, 2)
            
            # TLS Handshake
            elif event_name == "connection.start_tls.started":
                marks["tls_start"] = now
            elif event_name == "connection.start_tls.complete":
                step_timings["tls_ms"] = round((now - marks.get("tls_start", now)) * 1000, 2)
            
            # TTFB (Time to First Byte)
            elif event_name in ["http11.send_request_headers.started", "http2.send_request_headers.started"]:
                marks["req_sent"] = now
            elif event_name in ["http11.receive_response_headers.started", "http2.receive_response_headers.started"]:
                sent_at = marks.get("req_sent", now)
                step_timings["ttfb_ms"] = round((now - sent_at) * 1000, 2)
        
        step_start = time.perf_counter()
        
        try:
            # Perform HTTP check with trace hooks for detailed timing
            transport = httpx.AsyncHTTPTransport(retries=0)
            
            async with httpx.AsyncClient(
                transport=transport,
                timeout=httpx.Timeout(10.0),
                follow_redirects=True
            ) as client:
                response = await client.request(
                    "GET",
                    step_url,
                    extensions={"trace": trace_handler}
                )
                
                step_timings["total_ms"] = round((time.perf_counter() - step_start) * 1000, 2)
                
                # Check status code first
                step_status = "UP" if response.is_success else "ISSUE"
                step_error = None
                
                if response.status_code >= 500:
                    step_status = "DOWN"
                    all_successful = False
                    if not failed_step:
                        failed_step = step_name
                        failure_reason = f"Server error (HTTP {response.status_code})"
                    step_error = f"HTTP {response.status_code}"
                elif response.status_code >= 400:
                    all_successful = False
                    if not failed_step:
                        failed_step = step_name
                        failure_reason = f"Client error (HTTP {response.status_code})"
                    step_error = f"HTTP {response.status_code}"
                
                # KEYWORD VALIDATION (Positive Assertion)
                # Check if required keyword exists in page content (case-insensitive)
                required_keyword = step.get('required_keyword')
                if required_keyword and response.is_success:
                    logger.info(f"[KEYWORD_CHECK] Checking for keyword '{required_keyword}' in step {step_order}")
                    
                    try:
                        page_content = response.text
                        # Case-insensitive search
                        if required_keyword.lower() not in page_content.lower():
                            # Keyword not found - mark as DOWN
                            step_status = "DOWN"
                            all_successful = False
                            step_error = f"Keyword '{required_keyword}' not found in page content"
                            
                            if not failed_step:
                                failed_step = step_name
                                failure_reason = f"Required keyword '{required_keyword}' missing from page"
                            
                            logger.warning(f"[KEYWORD_CHECK] ✗ Keyword '{required_keyword}' NOT FOUND in step {step_order}")
                        else:
                            logger.info(f"[KEYWORD_CHECK] ✓ Keyword '{required_keyword}' found in step {step_order}")
                    except Exception as e:
                        logger.error(f"[KEYWORD_CHECK] Error reading page content: {str(e)}")
                        step_error = f"Failed to read page content: {str(e)}"
                        step_status = "DOWN"
                        all_successful = False
                        if not failed_step:
                            failed_step = step_name
                            failure_reason = f"Content validation error: {str(e)}"
                
                step_result = {
                    "name": step_name,
                    "url": step_url,
                    "order": step_order,
                    "status": step_status,
                    "status_code": response.status_code,
                    "latency_ms": step_timings["total_ms"],
                    # Detailed timing breakdown
                    "dns_ms": step_timings["dns_ms"],
                    "tcp_ms": step_timings["tcp_ms"],
                    "tls_ms": step_timings["tls_ms"],
                    "ttfb_ms": step_timings["ttfb_ms"],
                    "error": step_error,
                    "required_keyword": required_keyword,
                    "keyword_found": required_keyword and step_status == "UP" if required_keyword else None,
                    "checked_at": datetime.now(timezone.utc).isoformat()
                }
                
                logger.info(f"[SCENARIO_CHECK] Step {step_order} result: {step_status}, {response.status_code}, {step_timings['total_ms']}ms (TCP: {step_timings['tcp_ms']}ms, TLS: {step_timings['tls_ms']}ms, TTFB: {step_timings['ttfb_ms']}ms)")
                
                # Track overall status
                if response.status_code >= 400:
                    overall_status_code = response.status_code
                
                total_latency += step_timings["total_ms"]
                step_results.append(step_result)
                
                # SHORT-CIRCUIT: If this step failed, stop checking remaining steps
                # This saves resources and provides faster feedback
                if step_status == "DOWN":
                    logger.warning(f"[SCENARIO_CHECK] Short-circuiting: Step {step_order} failed, skipping remaining steps")
                    break
                
        except httpx.TimeoutException as e:
            step_timings["total_ms"] = round((time.perf_counter() - step_start) * 1000, 2)
            logger.error(f"[SCENARIO_CHECK] Step {step_order} timeout: {str(e)}")
            
            if not failed_step:
                failed_step = step_name
                failure_reason = f"Request timeout after {step_timings['total_ms']}ms"
            
            step_result = {
                "name": step_name,
                "url": step_url,
                "order": step_order,
                "status": "DOWN",
                "status_code": 0,
                "latency_ms": step_timings["total_ms"],
                "dns_ms": step_timings["dns_ms"],
                "tcp_ms": step_timings["tcp_ms"],
                "tls_ms": step_timings["tls_ms"],
                "ttfb_ms": step_timings["ttfb_ms"],
                "error": f"Timeout: Request took longer than 10 seconds",
                "checked_at": datetime.now(timezone.utc).isoformat()
            }
            
            all_successful = False
            overall_status_code = 0
            total_latency += step_timings["total_ms"]
            step_results.append(step_result)
            
            # SHORT-CIRCUIT: Stop on timeout
            logger.warning(f"[SCENARIO_CHECK] Short-circuiting: Step {step_order} timed out, skipping remaining steps")
            break
            
        except httpx.ConnectError as e:
            step_timings["total_ms"] = round((time.perf_counter() - step_start) * 1000, 2)
            logger.error(f"[SCENARIO_CHECK] Step {step_order} connection error: {str(e)}")
            
            if not failed_step:
                failed_step = step_name
                failure_reason = f"Connection failed: Unable to reach server"
            
            step_result = {
                "name": step_name,
                "url": step_url,
                "order": step_order,
                "status": "DOWN",
                "status_code": 0,
                "latency_ms": step_timings["total_ms"],
                "dns_ms": step_timings["dns_ms"],
                "tcp_ms": step_timings["tcp_ms"],
                "tls_ms": step_timings["tls_ms"],
                "ttfb_ms": step_timings["ttfb_ms"],
                "error": f"Connection Error: {str(e)}",
                "checked_at": datetime.now(timezone.utc).isoformat()
            }
            
            all_successful = False
            overall_status_code = 0
            total_latency += step_timings["total_ms"]
            step_results.append(step_result)
            
            # SHORT-CIRCUIT: Stop on connection error
            logger.warning(f"[SCENARIO_CHECK] Short-circuiting: Step {step_order} connection failed, skipping remaining steps")
            break
            
        except Exception as e:
            step_timings["total_ms"] = round((time.perf_counter() - step_start) * 1000, 2)
            logger.error(f"[SCENARIO_CHECK] Step {step_order} failed: {str(e)}")
            
            if not failed_step:
                failed_step = step_name
                failure_reason = f"Unexpected error: {str(e)}"
            
            step_result = {
                "name": step_name,
                "url": step_url,
                "order": step_order,
                "status": "DOWN",
                "status_code": 0,
                "latency_ms": step_timings["total_ms"],
                "dns_ms": step_timings["dns_ms"],
                "tcp_ms": step_timings["tcp_ms"],
                "tls_ms": step_timings["tls_ms"],
                "ttfb_ms": step_timings["ttfb_ms"],
                "error": str(e),
                "checked_at": datetime.now(timezone.utc).isoformat()
            }
            
            all_successful = False
            overall_status_code = 0
            total_latency += step_timings["total_ms"]
            step_results.append(step_result)
            
            # SHORT-CIRCUIT: Stop on unexpected error
            logger.warning(f"[SCENARIO_CHECK] Short-circuiting: Step {step_order} failed unexpectedly, skipping remaining steps")
            break
    
    # Determine overall status
    if all_successful:
        overall_status = "UP"
        summary_message = f"All {len(step_results)} steps completed successfully"
    elif any(s['status'] == 'DOWN' for s in step_results):
        overall_status = "DOWN"
        summary_message = f"Scenario failed at step {failed_step}: {failure_reason}"
    else:
        overall_status = "ISSUE"
        summary_message = f"Scenario has issues at step {failed_step}: {failure_reason}"
    
    logger.info(f"[SCENARIO_CHECK] Scenario complete: {overall_status}, total latency: {total_latency}ms")
    logger.info(f"[SCENARIO_CHECK] Summary: {summary_message}")
    
    return {
        "status": overall_status,
        "status_code": overall_status_code,
        "total_latency_ms": round(total_latency, 2),
        "step_results": step_results,
        "steps_checked": len(step_results),
        "steps_successful": sum(1 for s in step_results if s['status'] == 'UP'),
        "failed_step": failed_step,
        "failure_reason": failure_reason,
        "summary": summary_message
    }


async def perform_check(monitor_id: UUID, url: str, db: AsyncSession) -> dict:
    logger.info(f"[PERFORM_CHECK] Starting check for monitor {monitor_id}, URL: {url}")
    check_time = datetime.now(timezone.utc)
    
    # Get monitor to check type
    monitor_result = await db.execute(
        select(Monitor).where(Monitor.id == monitor_id)
    )
    monitor = monitor_result.scalar_one_or_none()
    
    if not monitor:
        logger.error(f"[PERFORM_CHECK] Monitor {monitor_id} not found")
        return {"status": "ERROR", "error": "Monitor not found"}
    
    # Check if this is a scenario monitor
    is_scenario = monitor.monitor_type == "scenario" and monitor.steps
    
    if is_scenario:
        logger.info(f"[PERFORM_CHECK] Scenario monitor detected with {len(monitor.steps)} steps")
        # Perform scenario check
        scenario_result = await perform_scenario_check(monitor.steps, db)
        
        # SSL check only for main URL
        ssl_info = None
        try:
            import asyncio
            ssl_info = await asyncio.to_thread(get_ssl_info, url)
            if ssl_info:
                logger.info(f"[SSL_CHECK] ✓ SSL check for main URL: {ssl_info['status']}, {ssl_info['days_remaining']} days")
        except Exception as e:
            logger.error(f"[SSL_CHECK] ✗ SSL check failed: {str(e)}")
        
        # Update monitor
        try:
            update_values = {"last_status": scenario_result["status"]}
            if ssl_info:
                update_values.update({
                    "ssl_status": ssl_info["status"],
                    "ssl_expiry_date": ssl_info["expiry_date"],
                    "ssl_days_remaining": ssl_info["days_remaining"]
                })
            
            await db.execute(
                update(Monitor).where(Monitor.id == monitor_id).values(**update_values)
            )
            
            # Create heartbeat with step results
            new_heartbeat = Heartbeat(
                monitor_id=monitor_id,
                status_code=scenario_result["status_code"],
                latency_ms=scenario_result["total_latency_ms"],
                tcp_connect_ms=None,  # Not applicable for scenarios
                tls_handshake_ms=None,
                ttfb_ms=None,
                timing_details={
                    "steps_checked": scenario_result["steps_checked"],
                    "steps_successful": scenario_result["steps_successful"],
                    "failed_step": scenario_result.get("failed_step"),
                    "failure_reason": scenario_result.get("failure_reason"),
                    "summary": scenario_result.get("summary")
                },
                step_results=scenario_result["step_results"],  # Store step results in JSONB
                error_message=scenario_result.get("failure_reason") if scenario_result["status"] != "UP" else None,
                created_at=check_time
            )
            
            db.add(new_heartbeat)
            await db.commit()
            logger.info(f"[DB_COMMIT] Scenario heartbeat saved for monitor {monitor_id}")
            
            return {
                "status": scenario_result["status"],
                "status_code": scenario_result["status_code"],
                "latency_ms": scenario_result["total_latency_ms"],
                "step_results": scenario_result["step_results"],
                "ssl": ssl_info
            }
            
        except Exception as e:
            await db.rollback()
            logger.error(f"[DB_ERROR] Failed to save scenario results: {str(e)}", exc_info=True)
            return {"status": "ERROR", "error": str(e)}
    
    else:
        # Simple monitor - use existing deep check logic
        logger.info(f"[PERFORM_CHECK] Simple monitor - performing deep check")
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
                step_results=None,  # No steps for simple monitors
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
