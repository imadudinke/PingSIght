from fastapi import APIRouter, Depends
from datetime import datetime

from app.core.security import get_current_user
from app.models.user import User
from app.worker.scheduler import monitor_scheduler

router = APIRouter(prefix="/status", tags=["status"])


@router.get("/scheduler")
async def get_scheduler_status(current_user: User = Depends(get_current_user)):
    """Get detailed scheduler status (requires authentication)."""
    return monitor_scheduler.get_job_status()


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