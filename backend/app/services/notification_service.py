"""Notification service for sending alerts via Discord and other channels"""
import httpx
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification_settings import UserNotificationSettings
from app.models.monitor import Monitor

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications to users"""
    
    @staticmethod
    async def send_discord_webhook(webhook_url: str, content: str, embed: Optional[dict] = None) -> bool:
        """
        Send a message to Discord via webhook
        
        Args:
            webhook_url: Discord webhook URL
            content: Message content
            embed: Optional Discord embed object
            
        Returns:
            True if successful, False otherwise
        """
        if not webhook_url:
            logger.warning("Discord webhook URL not provided")
            return False
        
        try:
            payload = {"content": content}
            if embed:
                payload["embeds"] = [embed]
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(webhook_url, json=payload)
                response.raise_for_status()
                logger.info(f"Discord notification sent successfully")
                return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to send Discord notification: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending Discord notification: {str(e)}")
            return False
    
    @staticmethod
    async def send_slack_webhook(webhook_url: str, text: str, blocks: Optional[list] = None) -> bool:
        """
        Send a message to Slack via webhook
        
        Args:
            webhook_url: Slack webhook URL
            text: Message text (fallback for notifications)
            blocks: Optional Slack Block Kit blocks for rich formatting
            
        Returns:
            True if successful, False otherwise
        """
        if not webhook_url:
            logger.warning("Slack webhook URL not provided")
            return False
        
        try:
            payload = {"text": text}
            if blocks:
                payload["blocks"] = blocks
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(webhook_url, json=payload)
                response.raise_for_status()
                logger.info(f"Slack notification sent successfully")
                return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to send Slack notification: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending Slack notification: {str(e)}")
            return False
    
    @staticmethod
    async def get_user_settings(db: AsyncSession, user_id: str) -> Optional[UserNotificationSettings]:
        """Get user notification settings"""
        result = await db.execute(
            select(UserNotificationSettings).where(UserNotificationSettings.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_default_settings(db: AsyncSession, user_id: str) -> UserNotificationSettings:
        """Create default notification settings for a user"""
        settings = UserNotificationSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        return settings
    
    @staticmethod
    def create_monitor_down_embed(monitor: Monitor, error_message: Optional[str] = None) -> dict:
        """Create Discord embed for monitor down alert"""
        return {
            "title": f"🔴 Monitor DOWN: {monitor.name}",
            "description": f"Monitor **{monitor.name}** is currently down.",
            "color": 15158332,  # Red color
            "fields": [
                {
                    "name": "URL",
                    "value": monitor.url,
                    "inline": False
                },
                {
                    "name": "Monitor Type",
                    "value": monitor.monitor_type.upper(),
                    "inline": True
                },
                {
                    "name": "Check Interval",
                    "value": f"{monitor.interval_seconds}s",
                    "inline": True
                },
                {
                    "name": "Error",
                    "value": error_message or "Connection failed",
                    "inline": False
                }
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "PingSight Monitoring"
            }
        }
    
    @staticmethod
    def create_monitor_recovery_embed(monitor: Monitor, downtime_duration: Optional[str] = None) -> dict:
        """Create Discord embed for monitor recovery alert"""
        fields = [
            {
                "name": "URL",
                "value": monitor.url,
                "inline": False
            },
            {
                "name": "Monitor Type",
                "value": monitor.monitor_type.upper(),
                "inline": True
            },
            {
                "name": "Check Interval",
                "value": f"{monitor.interval_seconds}s",
                "inline": True
            }
        ]
        
        if downtime_duration:
            fields.append({
                "name": "Downtime Duration",
                "value": downtime_duration,
                "inline": False
            })
        
        return {
            "title": f"✅ Monitor RECOVERED: {monitor.name}",
            "description": f"Monitor **{monitor.name}** is back online.",
            "color": 3066993,  # Green color
            "fields": fields,
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "PingSight Monitoring"
            }
        }
    
    @staticmethod
    def create_ssl_expiry_embed(monitor: Monitor, days_remaining: int) -> dict:
        """Create Discord embed for SSL expiry warning"""
        return {
            "title": f"⚠️ SSL Certificate Expiring: {monitor.name}",
            "description": f"SSL certificate for **{monitor.name}** will expire in **{days_remaining} days**.",
            "color": 16776960,  # Yellow color
            "fields": [
                {
                    "name": "URL",
                    "value": monitor.url,
                    "inline": False
                },
                {
                    "name": "Days Remaining",
                    "value": str(days_remaining),
                    "inline": True
                },
                {
                    "name": "Expiry Date",
                    "value": monitor.ssl_expiry_date.strftime("%Y-%m-%d") if monitor.ssl_expiry_date else "Unknown",
                    "inline": True
                }
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "PingSight Monitoring"
            }
        }
    
    @staticmethod
    def create_domain_expiry_embed(monitor: Monitor, days_remaining: int) -> dict:
        """Create Discord embed for domain expiry warning"""
        return {
            "title": f"⚠️ Domain Expiring: {monitor.name}",
            "description": f"Domain for **{monitor.name}** will expire in **{days_remaining} days**.",
            "color": 16776960,  # Yellow color
            "fields": [
                {
                    "name": "URL",
                    "value": monitor.url,
                    "inline": False
                },
                {
                    "name": "Days Remaining",
                    "value": str(days_remaining),
                    "inline": True
                },
                {
                    "name": "Expiry Date",
                    "value": monitor.domain_expiry_date.strftime("%Y-%m-%d") if monitor.domain_expiry_date else "Unknown",
                    "inline": True
                }
            ],
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "PingSight Monitoring"
            }
        }
    
    # Slack Block Kit formatters
    @staticmethod
    def create_monitor_down_blocks(monitor: Monitor, error_message: Optional[str] = None) -> list:
        """Create Slack blocks for monitor down alert"""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🔴 Monitor DOWN: {monitor.name}"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*URL:*\n{monitor.url}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Monitor Type:*\n{monitor.monitor_type.upper()}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Check Interval:*\n{monitor.interval_seconds}s"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Error:*\n{error_message or 'Connection failed'}"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"PingSight Monitoring • {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                    }
                ]
            }
        ]
    
    @staticmethod
    def create_monitor_recovery_blocks(monitor: Monitor, downtime_duration: Optional[str] = None) -> list:
        """Create Slack blocks for monitor recovery alert"""
        fields = [
            {
                "type": "mrkdwn",
                "text": f"*URL:*\n{monitor.url}"
            },
            {
                "type": "mrkdwn",
                "text": f"*Monitor Type:*\n{monitor.monitor_type.upper()}"
            },
            {
                "type": "mrkdwn",
                "text": f"*Check Interval:*\n{monitor.interval_seconds}s"
            }
        ]
        
        if downtime_duration:
            fields.append({
                "type": "mrkdwn",
                "text": f"*Downtime Duration:*\n{downtime_duration}"
            })
        
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"✅ Monitor RECOVERED: {monitor.name}"
                }
            },
            {
                "type": "section",
                "fields": fields
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"PingSight Monitoring • {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                    }
                ]
            }
        ]
    
    @staticmethod
    def create_ssl_expiry_blocks(monitor: Monitor, days_remaining: int) -> list:
        """Create Slack blocks for SSL expiry warning"""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"⚠️ SSL Certificate Expiring: {monitor.name}"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*URL:*\n{monitor.url}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Days Remaining:*\n{days_remaining}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Expiry Date:*\n{monitor.ssl_expiry_date.strftime('%Y-%m-%d') if monitor.ssl_expiry_date else 'Unknown'}"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"PingSight Monitoring • {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                    }
                ]
            }
        ]
    
    @staticmethod
    def create_domain_expiry_blocks(monitor: Monitor, days_remaining: int) -> list:
        """Create Slack blocks for domain expiry warning"""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"⚠️ Domain Expiring: {monitor.name}"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*URL:*\n{monitor.url}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Days Remaining:*\n{days_remaining}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Expiry Date:*\n{monitor.domain_expiry_date.strftime('%Y-%m-%d') if monitor.domain_expiry_date else 'Unknown'}"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"PingSight Monitoring • {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                    }
                ]
            }
        ]
    
    @staticmethod
    async def send_monitor_down_alert(
        db: AsyncSession,
        monitor: Monitor,
        error_message: Optional[str] = None
    ) -> bool:
        """Send alert when monitor goes down"""
        settings = await NotificationService.get_user_settings(db, str(monitor.user_id))
        
        if not settings or not settings.alert_on_down:
            return False
        
        success = False
        
        # Send Discord notification
        if settings.discord_enabled and settings.discord_webhook_url:
            embed = NotificationService.create_monitor_down_embed(monitor, error_message)
            discord_success = await NotificationService.send_discord_webhook(
                settings.discord_webhook_url,
                f"🔴 **ALERT**: Monitor `{monitor.name}` is DOWN!",
                embed
            )
            success = success or discord_success
        
        # Send Slack notification
        if settings.slack_enabled and settings.slack_webhook_url:
            blocks = NotificationService.create_monitor_down_blocks(monitor, error_message)
            slack_success = await NotificationService.send_slack_webhook(
                settings.slack_webhook_url,
                f"🔴 ALERT: Monitor {monitor.name} is DOWN!",
                blocks
            )
            success = success or slack_success
        
        return success
    
    @staticmethod
    async def send_monitor_recovery_alert(
        db: AsyncSession,
        monitor: Monitor,
        downtime_duration: Optional[str] = None
    ) -> bool:
        """Send alert when monitor recovers"""
        settings = await NotificationService.get_user_settings(db, str(monitor.user_id))
        
        if not settings or not settings.alert_on_recovery:
            return False
        
        success = False
        
        # Send Discord notification
        if settings.discord_enabled and settings.discord_webhook_url:
            embed = NotificationService.create_monitor_recovery_embed(monitor, downtime_duration)
            discord_success = await NotificationService.send_discord_webhook(
                settings.discord_webhook_url,
                f"✅ **RECOVERED**: Monitor `{monitor.name}` is back online!",
                embed
            )
            success = success or discord_success
        
        # Send Slack notification
        if settings.slack_enabled and settings.slack_webhook_url:
            blocks = NotificationService.create_monitor_recovery_blocks(monitor, downtime_duration)
            slack_success = await NotificationService.send_slack_webhook(
                settings.slack_webhook_url,
                f"✅ RECOVERED: Monitor {monitor.name} is back online!",
                blocks
            )
            success = success or slack_success
        
        return success
    
    @staticmethod
    async def send_ssl_expiry_alert(
        db: AsyncSession,
        monitor: Monitor,
        days_remaining: int
    ) -> bool:
        """Send alert for SSL certificate expiry"""
        settings = await NotificationService.get_user_settings(db, str(monitor.user_id))
        
        if not settings:
            return False
        
        # Only alert if days remaining matches the threshold
        if days_remaining != settings.ssl_expiry_alert_days:
            return False
        
        success = False
        
        # Send Discord notification
        if settings.discord_enabled and settings.discord_webhook_url:
            embed = NotificationService.create_ssl_expiry_embed(monitor, days_remaining)
            discord_success = await NotificationService.send_discord_webhook(
                settings.discord_webhook_url,
                f"⚠️ **SSL WARNING**: Certificate for `{monitor.name}` expires in {days_remaining} days!",
                embed
            )
            success = success or discord_success
        
        # Send Slack notification
        if settings.slack_enabled and settings.slack_webhook_url:
            blocks = NotificationService.create_ssl_expiry_blocks(monitor, days_remaining)
            slack_success = await NotificationService.send_slack_webhook(
                settings.slack_webhook_url,
                f"⚠️ SSL WARNING: Certificate for {monitor.name} expires in {days_remaining} days!",
                blocks
            )
            success = success or slack_success
        
        return success
    
    @staticmethod
    async def send_domain_expiry_alert(
        db: AsyncSession,
        monitor: Monitor,
        days_remaining: int
    ) -> bool:
        """Send alert for domain expiry"""
        settings = await NotificationService.get_user_settings(db, str(monitor.user_id))
        
        if not settings:
            return False
        
        # Only alert if days remaining matches the threshold
        if days_remaining != settings.domain_expiry_alert_days:
            return False
        
        success = False
        
        # Send Discord notification
        if settings.discord_enabled and settings.discord_webhook_url:
            embed = NotificationService.create_domain_expiry_embed(monitor, days_remaining)
            discord_success = await NotificationService.send_discord_webhook(
                settings.discord_webhook_url,
                f"⚠️ **DOMAIN WARNING**: Domain for `{monitor.name}` expires in {days_remaining} days!",
                embed
            )
            success = success or discord_success
        
        # Send Slack notification
        if settings.slack_enabled and settings.slack_webhook_url:
            blocks = NotificationService.create_domain_expiry_blocks(monitor, days_remaining)
            slack_success = await NotificationService.send_slack_webhook(
                settings.slack_webhook_url,
                f"⚠️ DOMAIN WARNING: Domain for {monitor.name} expires in {days_remaining} days!",
                blocks
            )
            success = success or slack_success
        
        return success
