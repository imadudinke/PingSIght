"""API endpoints for notification settings"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, validator
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.models.notification_settings import UserNotificationSettings
from app.core.security import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationSettingsResponse(BaseModel):
    discord_webhook_url: Optional[str] = None
    discord_enabled: bool
    alert_on_down: bool
    alert_on_recovery: bool
    alert_threshold: int
    ssl_expiry_alert_days: int
    domain_expiry_alert_days: int


class NotificationSettingsUpdate(BaseModel):
    discord_webhook_url: Optional[str] = Field(None, max_length=500)
    discord_enabled: Optional[bool] = None
    alert_on_down: Optional[bool] = None
    alert_on_recovery: Optional[bool] = None
    alert_threshold: Optional[int] = Field(None, ge=1, le=10)
    ssl_expiry_alert_days: Optional[int] = Field(None, ge=1, le=90)
    domain_expiry_alert_days: Optional[int] = Field(None, ge=1, le=365)
    
    @validator('discord_webhook_url')
    def validate_webhook_url(cls, v):
        if v and not v.startswith('https://discord.com/api/webhooks/'):
            raise ValueError('Invalid Discord webhook URL format')
        return v


class TestNotificationRequest(BaseModel):
    message: str = Field(default="This is a test notification from PingSight!", max_length=200)


@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user notification settings"""
    settings = await NotificationService.get_user_settings(db, str(current_user.id))
    
    if not settings:
        # Create default settings if they don't exist
        settings = await NotificationService.create_default_settings(db, str(current_user.id))
    
    return NotificationSettingsResponse(
        discord_webhook_url=settings.discord_webhook_url,
        discord_enabled=settings.discord_enabled,
        alert_on_down=settings.alert_on_down,
        alert_on_recovery=settings.alert_on_recovery,
        alert_threshold=settings.alert_threshold,
        ssl_expiry_alert_days=settings.ssl_expiry_alert_days,
        domain_expiry_alert_days=settings.domain_expiry_alert_days
    )


@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user notification settings"""
    settings = await NotificationService.get_user_settings(db, str(current_user.id))
    
    if not settings:
        settings = await NotificationService.create_default_settings(db, str(current_user.id))
    
    # Update fields if provided
    if settings_update.discord_webhook_url is not None:
        settings.discord_webhook_url = settings_update.discord_webhook_url
    if settings_update.discord_enabled is not None:
        settings.discord_enabled = settings_update.discord_enabled
    if settings_update.alert_on_down is not None:
        settings.alert_on_down = settings_update.alert_on_down
    if settings_update.alert_on_recovery is not None:
        settings.alert_on_recovery = settings_update.alert_on_recovery
    if settings_update.alert_threshold is not None:
        settings.alert_threshold = settings_update.alert_threshold
    if settings_update.ssl_expiry_alert_days is not None:
        settings.ssl_expiry_alert_days = settings_update.ssl_expiry_alert_days
    if settings_update.domain_expiry_alert_days is not None:
        settings.domain_expiry_alert_days = settings_update.domain_expiry_alert_days
    
    await db.commit()
    await db.refresh(settings)
    
    return NotificationSettingsResponse(
        discord_webhook_url=settings.discord_webhook_url,
        discord_enabled=settings.discord_enabled,
        alert_on_down=settings.alert_on_down,
        alert_on_recovery=settings.alert_on_recovery,
        alert_threshold=settings.alert_threshold,
        ssl_expiry_alert_days=settings.ssl_expiry_alert_days,
        domain_expiry_alert_days=settings.domain_expiry_alert_days
    )


@router.post("/test")
async def test_notification(
    test_request: TestNotificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a test notification to verify webhook configuration"""
    settings = await NotificationService.get_user_settings(db, str(current_user.id))
    
    if not settings or not settings.discord_webhook_url:
        raise HTTPException(status_code=400, detail="Discord webhook URL not configured")
    
    if not settings.discord_enabled:
        raise HTTPException(status_code=400, detail="Discord notifications are disabled")
    
    # Create test embed
    embed = {
        "title": "🔔 Test Notification",
        "description": test_request.message,
        "color": 5814783,  # Blue color
        "fields": [
            {
                "name": "Status",
                "value": "✅ Your Discord webhook is working correctly!",
                "inline": False
            }
        ],
        "footer": {
            "text": "PingSight Monitoring"
        }
    }
    
    success = await NotificationService.send_discord_webhook(
        settings.discord_webhook_url,
        "🔔 **Test Notification**",
        embed
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send test notification. Please check your webhook URL.")
    
    return {"success": True, "message": "Test notification sent successfully"}
