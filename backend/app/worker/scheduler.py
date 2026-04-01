import logging
from datetime import datetime, timezone
from typing import Dict, Set
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor

from app.db.session import AsyncSessionLocal
from app.worker.engine import perform_check, get_active_monitors

# Configure logging
logger = logging.getLogger(__name__)

class MonitorScheduler:
    """
    Manages scheduling of monitor health checks using APScheduler.
    """
    
    def __init__(self):
        # Configure job stores and executors
        jobstores = {
            'default': MemoryJobStore()
        }
        executors = {
            'default': AsyncIOExecutor()
        }
        
        job_defaults = {
            'coalesce': True,  # Combine multiple pending executions into one
            'max_instances': 1,  # Only one instance of each job at a time
            'misfire_grace_time': 30  # Grace time for missed jobs
        }
        
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='UTC'
        )
        
        # Track scheduled monitors to avoid duplicates
        self.scheduled_monitors: Set[UUID] = set()
        
    def start(self):
        """Start the scheduler."""
        try:
            self.scheduler.start()
            logger.info("Monitor scheduler started successfully")
            
            # Schedule the monitor refresh job to run every minute
            self.scheduler.add_job(
                func=self.refresh_monitor_schedules,
                trigger=IntervalTrigger(minutes=1),
                id='refresh_monitors',
                name='Refresh Monitor Schedules',
                replace_existing=True
            )
            
            logger.info("Monitor refresh job scheduled (every 1 minute)")
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {str(e)}")
            raise
    
    def shutdown(self):
        """Shutdown the scheduler gracefully."""
        try:
            self.scheduler.shutdown(wait=True)
            logger.info("Monitor scheduler shut down successfully")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {str(e)}")
    
    async def refresh_monitor_schedules(self):
        """
        Refresh monitor schedules by checking for new/updated/deleted monitors.
        This runs periodically to sync the scheduler with the database.
        """
        try:
            logger.debug("Refreshing monitor schedules...")
            
            async with AsyncSessionLocal() as db:
                active_monitors = await get_active_monitors(db)
            
            # Get currently active monitor IDs
            current_monitor_ids = {monitor.id for monitor in active_monitors}
            
            # Remove jobs for monitors that are no longer active
            removed_monitors = self.scheduled_monitors - current_monitor_ids
            for monitor_id in removed_monitors:
                job_id = f"monitor_{monitor_id}"
                try:
                    self.scheduler.remove_job(job_id)
                    logger.info(f"Removed job for inactive monitor: {monitor_id}")
                except Exception as e:
                    logger.warning(f"Failed to remove job {job_id}: {str(e)}")
            
            # Add/update jobs for active monitors
            for monitor in active_monitors:
                await self.schedule_monitor(monitor)
            
            # Update tracked monitors
            self.scheduled_monitors = current_monitor_ids
            
            logger.debug(f"Monitor schedule refresh completed. Active monitors: {len(current_monitor_ids)}")
            
        except Exception as e:
            logger.error(f"Error refreshing monitor schedules: {str(e)}")
    
    async def schedule_monitor(self, monitor):
        """
        Schedule or update a monitor's health check job.
        
        Args:
            monitor: Monitor object from database
        """
        job_id = f"monitor_{monitor.id}"

        if monitor.is_maintenance:
            # Monitor is in maintenance mode — remove any existing job so no checks fire
            try:
                self.scheduler.remove_job(job_id)
                logger.info(f"Removed job for monitor {monitor.id} ({monitor.name}) — maintenance mode active")
            except Exception:
                pass
            return

        try:
            # Check if job already exists with same interval
            existing_job = self.scheduler.get_job(job_id)
            
            if existing_job:
                # Check if interval changed
                current_interval = existing_job.trigger.interval.total_seconds()
                if current_interval != monitor.interval_seconds:
                    # Interval changed, reschedule
                    self.scheduler.remove_job(job_id)
                    logger.info(f"Rescheduling monitor {monitor.id} due to interval change")
                else:
                    # Job exists with correct interval, no action needed
                    return
            
            # Add new job
            self.scheduler.add_job(
                func=self.execute_monitor_check,
                trigger=IntervalTrigger(seconds=monitor.interval_seconds),
                args=[monitor.id, monitor.url],
                id=job_id,
                name=f"Monitor: {monitor.name}",
                replace_existing=True
            )
            
            logger.info(f"Scheduled monitor {monitor.id} ({monitor.name}) - interval: {monitor.interval_seconds}s")
            
        except Exception as e:
            logger.error(f"Failed to schedule monitor {monitor.id}: {str(e)}")
    
    async def execute_monitor_check(self, monitor_id: UUID, url: str):
        """
        Execute a single monitor check.
        
        Args:
            monitor_id: UUID of the monitor
            url: URL to check
        """
        try:
            async with AsyncSessionLocal() as db:
                try:
                    result = await perform_check(monitor_id, url, db)
                    logger.debug(f"Monitor check completed: {result}")
                except Exception as e:
                    # Ensure rollback on any error
                    await db.rollback()
                    logger.error(f"Error in perform_check for {monitor_id}: {str(e)}", exc_info=True)
                    raise
                
        except Exception as e:
            logger.error(f"Error executing monitor check for {monitor_id}: {str(e)}")
    
    def get_job_status(self) -> Dict:
        """
        Get current scheduler status and job information.
        
        Returns:
            Dict with scheduler status information
        """
        jobs = self.scheduler.get_jobs()
        
        return {
            "scheduler_running": self.scheduler.running,
            "total_jobs": len(jobs),
            "monitor_jobs": len([job for job in jobs if job.id.startswith("monitor_")]),
            "next_run_time": min([job.next_run_time for job in jobs if job.next_run_time]) if jobs else None,
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in jobs
            ]
        }


# Global scheduler instance
monitor_scheduler = MonitorScheduler()