import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Set
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
from sqlalchemy import update

from app.db.session import AsyncSessionLocal
from app.models.monitor import Monitor
from app.worker.domain_checker import get_domain_expiry, should_check_domain
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

            # Schedule the domain expiration check to run every 24 hours.
            # next_run_time=now ensures the first run fires immediately on startup
            # so new monitors are checked right away instead of waiting 24h.
            self.scheduler.add_job(
                func=self.run_domain_checks,
                trigger=IntervalTrigger(hours=24),
                id='domain_checks',
                name='Daily Domain Expiration Checks',
                replace_existing=True,
                next_run_time=datetime.now(timezone.utc),
            )

            logger.info("Monitor refresh job scheduled (every 1 minute)")
            logger.info("Domain expiration check job scheduled (every 24 hours)")
            
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
    
    async def check_domain_for_monitor(self, monitor: Monitor):
        """
        Run an immediate domain check for a single monitor.
        Called right after a new monitor is created so it doesn't wait up to
        24 hours for the next batch sweep to populate domain fields.
        """
        logger.info(f"[DOMAIN] Immediate check for new monitor {monitor.id} ({monitor.name}): {monitor.url}")
        try:
            info = await asyncio.to_thread(get_domain_expiry, monitor.url)
            async with AsyncSessionLocal() as db:
                if info:
                    await db.execute(
                        update(Monitor).where(Monitor.id == monitor.id).values(
                            domain_status=info["status"],
                            domain_expiry_date=info["expiry_date"],
                            domain_days_remaining=info["days_remaining"],
                            domain_last_checked=datetime.now(timezone.utc),
                        )
                    )
                    logger.info(
                        f"[DOMAIN] ✓ {monitor.name}: {info['status']}, "
                        f"{info['days_remaining']} days remaining"
                    )
                else:
                    await db.execute(
                        update(Monitor).where(Monitor.id == monitor.id).values(
                            domain_last_checked=datetime.now(timezone.utc),
                        )
                    )
                    logger.warning(
                        f"[DOMAIN] ✗ WHOIS lookup failed for {monitor.name} — "
                        f"will retry in next 24h batch"
                    )
                await db.commit()
        except Exception as e:
            logger.error(f"[DOMAIN] Error in immediate domain check for {monitor.id}: {e}")

    async def run_domain_checks(self):
        """
        Run WHOIS domain expiration checks for all active monitors.
        Runs every 24 hours. A 2-second sleep between each domain keeps the
        checker polite and avoids WHOIS rate-limit bans.
        """
        logger.info("[DOMAIN] Starting daily domain expiration checks...")
        try:
            async with AsyncSessionLocal() as db:
                monitors = await get_active_monitors(db)
                checked = 0
                skipped = 0

                for monitor in monitors:
                    # None → never checked → check now; otherwise respect the 24h window
                    if not should_check_domain(monitor.domain_last_checked):
                        skipped += 1
                        continue

                    logger.info(f"[DOMAIN] Checking domain for monitor {monitor.id} ({monitor.name}): {monitor.url}")
                    info = await asyncio.to_thread(get_domain_expiry, monitor.url)

                    if info:
                        await db.execute(
                            update(Monitor).where(Monitor.id == monitor.id).values(
                                domain_status=info["status"],
                                domain_expiry_date=info["expiry_date"],
                                domain_days_remaining=info["days_remaining"],
                                domain_last_checked=datetime.now(timezone.utc),
                            )
                        )
                        logger.info(
                            f"[DOMAIN] ✓ {monitor.name}: {info['status']}, "
                            f"{info['days_remaining']} days remaining"
                        )
                    else:
                        # Graceful fail: stamp timestamp only, keep old expiry data intact
                        await db.execute(
                            update(Monitor).where(Monitor.id == monitor.id).values(
                                domain_last_checked=datetime.now(timezone.utc),
                            )
                        )
                        logger.warning(
                            f"[DOMAIN] ✗ WHOIS lookup failed for {monitor.name} — "
                            f"old data preserved, will retry in 24h"
                        )

                    checked += 1
                    # Be polite to WHOIS servers — avoid rate-limit bans
                    await asyncio.sleep(2)

                await db.commit()
                logger.info(
                    f"[DOMAIN] Domain checks complete: {checked} checked, {skipped} skipped (within 24h window)"
                )

        except Exception as e:
            logger.error(f"[DOMAIN] Error during domain expiration checks: {str(e)}", exc_info=True)

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