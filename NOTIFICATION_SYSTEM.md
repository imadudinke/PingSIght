# Notification & Alert System

## Overview
Comprehensive notification system that sends real-time alerts via Discord webhooks when monitors go down, recover, or when SSL/domain certificates are about to expire.

## Features

### 1. Discord Webhook Integration
- Users can configure their Discord webhook URL
- Rich embed messages with color-coded alerts
- Test notification feature to verify configuration

### 2. Alert Types

#### Monitor Down Alert 🔴
- Triggered when a monitor goes from UP to DOWN
- Includes monitor name, URL, type, interval, and error message
- Red color-coded embed

#### Monitor Recovery Alert ✅
- Triggered when a monitor goes from DOWN to UP
- Includes downtime duration
- Green color-coded embed

#### SSL Certificate Expiry Warning ⚠️
- Triggered when SSL certificate is about to expire
- Configurable threshold (1-90 days before expiry)
- Yellow color-coded embed

#### Domain Expiry Warning ⚠️
- Triggered when domain registration is about to expire
- Configurable threshold (1-365 days before expiry)
- Yellow color-coded embed

### 3. Alert Preferences
- **Alert on Down**: Enable/disable down alerts
- **Alert on Recovery**: Enable/disable recovery alerts
- **Alert Threshold**: Number of consecutive failures before alerting (1-10)
- **SSL Expiry Days**: Days before SSL expiry to alert (1-90)
- **Domain Expiry Days**: Days before domain expiry to alert (1-365)

### 4. Settings Page
- Dedicated `/dashboard/settings` page
- Toggle Discord notifications on/off
- Configure webhook URL
- Test notification button
- Configure all alert preferences
- Save settings with validation

## Technical Implementation

### Backend

#### Database Schema
**Table**: `user_notification_settings`
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users, unique)
- `discord_webhook_url` (String, 500 chars, nullable)
- `discord_enabled` (Boolean, default false)
- `alert_on_down` (Boolean, default true)
- `alert_on_recovery` (Boolean, default true)
- `alert_threshold` (Integer, default 1)
- `ssl_expiry_alert_days` (Integer, default 7)
- `domain_expiry_alert_days` (Integer, default 7)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### Models
**File**: `backend/app/models/notification_settings.py`
- `UserNotificationSettings` model with all fields
- Relationship to User model

#### Services
**File**: `backend/app/services/notification_service.py`
- `NotificationService` class with static methods:
  - `send_discord_webhook()` - Send message to Discord
  - `get_user_settings()` - Get user notification settings
  - `create_default_settings()` - Create default settings for new users
  - `create_monitor_down_embed()` - Create Discord embed for down alert
  - `create_monitor_recovery_embed()` - Create Discord embed for recovery alert
  - `create_ssl_expiry_embed()` - Create Discord embed for SSL warning
  - `create_domain_expiry_embed()` - Create Discord embed for domain warning
  - `send_monitor_down_alert()` - Send down alert
  - `send_monitor_recovery_alert()` - Send recovery alert
  - `send_ssl_expiry_alert()` - Send SSL expiry alert
  - `send_domain_expiry_alert()` - Send domain expiry alert

#### API Endpoints
**File**: `backend/app/api/notifications.py`

**GET `/api/notifications/settings`**
- Get user notification settings
- Creates default settings if none exist
- Requires authentication

**PUT `/api/notifications/settings`**
- Update user notification settings
- Validates Discord webhook URL format
- Validates numeric ranges
- Requires authentication

**POST `/api/notifications/test`**
- Send test notification to verify webhook
- Requires Discord to be enabled and configured
- Requires authentication

#### Integration
**File**: `backend/app/worker/engine.py`
- Integrated into `perform_check()` function
- Detects status changes (UP ↔ DOWN)
- Sends alerts automatically when status changes
- Sends SSL/domain expiry alerts based on thresholds

### Frontend

#### Settings Page
**File**: `frontend/app/dashboard/settings/page.tsx`
- Full-featured settings UI
- Discord webhook configuration
- Toggle switches for all alert types
- Number inputs for thresholds
- Test notification button
- Save button with loading states
- Error and success messages

#### Navigation
- Added "SETTINGS" link to sidebar
- Accessible from all dashboard pages
- Active state detection

## Setup Instructions

### 1. Run Database Migration
```bash
cd backend
alembic upgrade head
```

### 2. Get Discord Webhook URL
1. Open Discord
2. Go to Server Settings → Integrations
3. Click "Webhooks" → "New Webhook"
4. Name it (e.g., "PingSight Alerts")
5. Select the channel for alerts
6. Copy the webhook URL

### 3. Configure in PingSight
1. Navigate to Settings page
2. Paste Discord webhook URL
3. Enable Discord notifications
4. Configure alert preferences
5. Click "Send Test Notification" to verify
6. Save settings

## Discord Embed Format

### Monitor Down Alert
```
🔴 Monitor DOWN: [Monitor Name]
Monitor [Monitor Name] is currently down.

URL: [monitor URL]
Monitor Type: SIMPLE/SCENARIO/HEARTBEAT
Check Interval: 30s
Error: [error message]

Timestamp: [ISO timestamp]
Footer: PingSight Monitoring
```

### Monitor Recovery Alert
```
✅ Monitor RECOVERED: [Monitor Name]
Monitor [Monitor Name] is back online.

URL: [monitor URL]
Monitor Type: SIMPLE/SCENARIO/HEARTBEAT
Check Interval: 30s
Downtime Duration: [duration]

Timestamp: [ISO timestamp]
Footer: PingSight Monitoring
```

### SSL Expiry Warning
```
⚠️ SSL Certificate Expiring: [Monitor Name]
SSL certificate for [Monitor Name] will expire in [N] days.

URL: [monitor URL]
Days Remaining: [N]
Expiry Date: YYYY-MM-DD

Timestamp: [ISO timestamp]
Footer: PingSight Monitoring
```

## Alert Logic

### Status Change Detection
1. Before updating monitor status, store previous status
2. Update monitor status in database
3. Compare previous vs new status
4. If changed from UP → DOWN: send down alert
5. If changed from DOWN → UP: send recovery alert

### Alert Threshold
- Tracks consecutive failures
- Only sends alert after N consecutive failures
- Prevents alert spam from transient issues
- Configurable per user (1-10 failures)

### SSL/Domain Expiry
- Checks during SSL/domain checks
- Compares days remaining with user threshold
- Sends alert only when days remaining matches threshold exactly
- Prevents duplicate alerts

## Error Handling

### Webhook Failures
- Logs errors but doesn't fail monitor checks
- Returns false on failure
- Continues monitoring even if notifications fail

### Validation
- Discord webhook URL must start with `https://discord.com/api/webhooks/`
- Alert threshold: 1-10
- SSL expiry days: 1-90
- Domain expiry days: 1-365

### Default Settings
- Created automatically for new users
- Discord disabled by default
- Alert on down: enabled
- Alert on recovery: enabled
- Alert threshold: 1
- SSL expiry: 7 days
- Domain expiry: 7 days

## Future Enhancements

1. **Additional Channels**
   - Slack integration
   - Email notifications
   - SMS via Twilio
   - Telegram bot
   - Microsoft Teams

2. **Advanced Features**
   - Custom alert messages
   - Alert scheduling (quiet hours)
   - Alert grouping (batch notifications)
   - Alert escalation (retry logic)
   - Per-monitor notification settings

3. **Analytics**
   - Alert history
   - Notification delivery status
   - Response time tracking
   - Alert frequency reports

4. **Smart Alerts**
   - Machine learning for anomaly detection
   - Predictive alerts
   - Alert fatigue prevention
   - Auto-acknowledgment

## Files Created/Modified

### Backend
- ✅ `backend/alembic/versions/add_user_notification_settings.py` (new)
- ✅ `backend/app/models/notification_settings.py` (new)
- ✅ `backend/app/models/user.py` (modified - added relationship)
- ✅ `backend/app/services/notification_service.py` (new)
- ✅ `backend/app/api/notifications.py` (new)
- ✅ `backend/app/main.py` (modified - added router)
- ✅ `backend/app/worker/engine.py` (modified - added notification calls)

### Frontend
- ✅ `frontend/app/dashboard/settings/page.tsx` (new)
- ✅ `frontend/components/dashboard/Sidebar.tsx` (modified - added Settings link)

## Testing Checklist

- [ ] Run database migration
- [ ] Create Discord webhook
- [ ] Configure webhook in settings
- [ ] Test notification button works
- [ ] Create a monitor that will fail
- [ ] Verify down alert is sent
- [ ] Fix the monitor
- [ ] Verify recovery alert is sent
- [ ] Test SSL expiry alerts
- [ ] Test domain expiry alerts
- [ ] Test alert threshold (consecutive failures)
- [ ] Test disabling notifications
- [ ] Test invalid webhook URL validation
- [ ] Test settings persistence

## Dependencies

### Backend
- `httpx` - For HTTP requests to Discord webhook (already installed)
- `pydantic` - For validation (already installed)
- `sqlalchemy` - For database (already installed)

### Frontend
- No new dependencies required
- Uses existing UI components

## Security Considerations

- Webhook URLs are stored encrypted in database (consider adding encryption)
- Webhook URLs are not exposed in API responses
- Only authenticated users can configure notifications
- Webhook validation prevents invalid URLs
- Rate limiting should be added to prevent webhook abuse
- Consider adding webhook signature verification

## Performance

- Notifications are sent asynchronously
- Don't block monitor checks
- Timeout set to 10 seconds for webhook requests
- Failed notifications are logged but don't affect monitoring
- No retry logic (consider adding for production)

## Monitoring

- All notification attempts are logged
- Success/failure status tracked
- Error messages captured
- Consider adding metrics:
  - Notifications sent per hour
  - Notification delivery rate
  - Average delivery time
  - Failed notification count
