# Slack Notifications Implementation

## Overview
Added Slack webhook support alongside Discord for comprehensive notification delivery. Users can now receive alerts through both Discord and Slack channels simultaneously.

## Backend Changes

### 1. Database Migration
**File**: `backend/alembic/versions/add_slack_notifications.py`
- Added `slack_webhook_url` (String, 500 chars)
- Added `slack_enabled` (Boolean, default false)

**To apply migration**:
```bash
cd backend
alembic upgrade head
```

### 2. Model Updates
**File**: `backend/app/models/notification_settings.py`
- Added Slack webhook URL field
- Added Slack enabled toggle field

### 3. Notification Service
**File**: `backend/app/services/notification_service.py`

**New Methods**:
- `send_slack_webhook()` - Sends messages to Slack using webhook
- `create_monitor_down_blocks()` - Slack Block Kit format for down alerts
- `create_monitor_recovery_blocks()` - Slack Block Kit format for recovery alerts
- `create_ssl_expiry_blocks()` - Slack Block Kit format for SSL warnings
- `create_domain_expiry_blocks()` - Slack Block Kit format for domain warnings

**Updated Methods**:
- All alert methods now send to both Discord and Slack if enabled
- Returns true if at least one channel succeeds

**Slack Block Kit Features**:
- Rich formatting with headers, sections, and context
- Markdown support for bold text and links
- Structured field layout for monitor details
- Consistent branding footer

### 4. API Endpoints
**File**: `backend/app/api/notifications.py`

**Updated Schemas**:
- `NotificationSettingsResponse` - Added slack_webhook_url and slack_enabled
- `NotificationSettingsUpdate` - Added Slack fields with validation

**Webhook URL Validation**:
- Discord: Must start with `https://discord.com/api/webhooks/`
- Slack: Must start with `https://hooks.slack.com/services/`

**Test Endpoint**:
- Now tests both Discord and Slack webhooks
- Returns which channels succeeded
- Fails only if all enabled channels fail

## Frontend Changes

### 1. Settings Interface
**File**: `frontend/app/dashboard/settings/page.tsx`

**Added Fields**:
- `slack_webhook_url` - Slack webhook URL input
- `slack_enabled` - Toggle for Slack notifications

**UI Components**:
- New Slack configuration panel matching Discord design
- Help text with step-by-step webhook setup instructions
- Disabled state when Slack is not enabled
- Test button works with both Discord and Slack

**Test Functionality**:
- Button enabled if either Discord or Slack is configured
- Shows which channels received the test notification
- Clear error messages for configuration issues

## Usage Guide

### Setting Up Slack Notifications

1. **Get Slack Webhook URL**:
   - Go to your Slack workspace
   - Navigate to Apps → Incoming Webhooks
   - Click "Add to Slack"
   - Select the channel for notifications
   - Copy the webhook URL (starts with `https://hooks.slack.com/services/`)

2. **Configure in PingSight**:
   - Go to Dashboard → Settings
   - Scroll to "SLACK_NOTIFICATIONS" section
   - Toggle "SLACK_ENABLED" to ON
   - Paste your webhook URL
   - Click "SEND_TEST_NOTIFICATION" to verify
   - Click "SAVE_NOTIFICATIONS"

3. **Alert Types**:
   - 🔴 Monitor Down - When a monitor fails
   - ✅ Monitor Recovery - When a monitor comes back online
   - ⚠️ SSL Expiry - When SSL certificate is expiring
   - ⚠️ Domain Expiry - When domain registration is expiring

### Multi-Channel Strategy

**Best Practices**:
- Enable both Discord and Slack for redundancy
- Use Discord for team chat notifications
- Use Slack for operations/on-call channels
- Configure different channels for different alert types (future feature)

**Reliability**:
- Alerts sent to all enabled channels
- Success if at least one channel delivers
- Independent failure handling per channel
- Detailed logging for troubleshooting

## Notification Format Comparison

### Discord (Embeds)
- Rich embeds with colors
- Inline fields for compact display
- Timestamp in ISO format
- Footer with branding

### Slack (Block Kit)
- Header blocks for titles
- Section blocks with markdown fields
- Context blocks for metadata
- Consistent spacing and layout

## Testing

### Manual Testing
1. Configure both Discord and Slack webhooks
2. Enable both channels
3. Click "SEND_TEST_NOTIFICATION"
4. Verify messages appear in both channels
5. Check formatting and readability

### Alert Testing
1. Create a test monitor pointing to a non-existent URL
2. Wait for monitor to fail
3. Verify down alert in both channels
4. Fix the URL or disable monitor
5. Verify recovery alert in both channels

## Error Handling

**Webhook Validation**:
- URL format checked on save
- Clear error messages for invalid URLs
- Prevents saving incorrect configurations

**Delivery Failures**:
- Logged with detailed error messages
- Doesn't block other channels
- User notified via test endpoint
- Automatic retry not implemented (future feature)

## Future Enhancements

1. **Channel-Specific Configuration**:
   - Different webhooks for different alert types
   - Severity-based routing
   - Time-based routing (business hours)

2. **Additional Platforms**:
   - Microsoft Teams
   - PagerDuty
   - Email (SMTP)
   - SMS (Twilio)

3. **Advanced Features**:
   - Alert grouping/batching
   - Rate limiting
   - Quiet hours
   - Escalation policies
   - Custom message templates

4. **Monitoring**:
   - Notification delivery metrics
   - Failed delivery tracking
   - Webhook health checks
   - Delivery latency monitoring

## Migration Notes

**Existing Users**:
- Migration adds Slack fields with default values
- Discord settings remain unchanged
- No action required unless adding Slack
- Backward compatible with existing webhooks

**Database**:
- Non-breaking schema change
- Nullable webhook URL field
- Default false for enabled flag
- No data migration needed

## Security Considerations

**Webhook URLs**:
- Stored in database (consider encryption for production)
- Not exposed in API responses to other users
- Validated format before saving
- HTTPS required for both platforms

**Best Practices**:
- Rotate webhook URLs periodically
- Use dedicated channels for monitoring
- Limit webhook permissions in Slack
- Monitor webhook usage for abuse
- Revoke unused webhooks

## Troubleshooting

**Slack Notifications Not Received**:
1. Verify webhook URL is correct
2. Check Slack channel permissions
3. Ensure webhook is not revoked
4. Test with "SEND_TEST_NOTIFICATION"
5. Check backend logs for errors

**Both Channels Failing**:
1. Check network connectivity
2. Verify webhook URLs are active
3. Check for rate limiting
4. Review backend logs
5. Test webhooks with curl

**Formatting Issues**:
1. Slack Block Kit has character limits
2. Long URLs may wrap
3. Emoji support varies by platform
4. Test with actual monitor names

## Performance Impact

**Minimal Overhead**:
- Async HTTP requests
- 10-second timeout per webhook
- Parallel delivery to channels
- No blocking on failures
- Efficient JSON serialization

**Scalability**:
- Handles multiple webhooks per user
- No database queries during delivery
- Stateless notification service
- Horizontal scaling ready
