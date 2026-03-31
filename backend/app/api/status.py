from fastapi import APIRouter, Depends
from datetime import datetime
from typing import Any, Dict

from app.core.security import get_current_user
from app.models.user import User
from app.worker.scheduler import monitor_scheduler
from app.worker.engine import perform_deep_check
from app.worker.ssl_checker import get_ssl_info

router = APIRouter(prefix="/status", tags=["status"])


@router.get("/scheduler")
async def get_scheduler_status(current_user: User = Depends(get_current_user)):
    """Get detailed scheduler status (requires authentication)."""
    return monitor_scheduler.get_job_status()


@router.get("/test-deep")
async def test_deep_check(url: str) -> Dict[str, Any]:
    """
    Test endpoint to perform a deep check on any URL.
    Returns detailed timing metrics including DNS, TCP, TLS, and TTFB.
    
    Example: /status/test-deep?url=https://google.com
    """
    result = await perform_deep_check(url)
    return result


@router.get("/test-ssl")
async def test_ssl_check(url: str) -> Dict[str, Any]:
    """
    Test endpoint to check SSL certificate information.
    Returns certificate expiry, days remaining, and status.
    
    Example: /status/test-ssl?url=https://google.com
    """
    ssl_info = get_ssl_info(url)
    
    if not ssl_info:
        return {
            "error": "Unable to retrieve SSL information. URL must be HTTPS.",
            "url": url
        }
    
    return {
        "url": url,
        "ssl_status": ssl_info["status"],
        "days_remaining": ssl_info["days_remaining"],
        "expiry_date": ssl_info["expiry_date"].isoformat(),
        "issuer": ssl_info.get("issuer"),
        "subject": ssl_info.get("subject")
    }


@router.post("/scheduler/refresh")
async def refresh_scheduler(current_user: User = Depends(get_current_user)):
    """Manually trigger scheduler refresh (requires authentication)."""
    try:
        await monitor_scheduler.refresh_monitor_schedules()
        return {
            "message": "Scheduler refresh triggered successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": f"Failed to refresh scheduler: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }