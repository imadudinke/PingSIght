# Notification System Setup Guide

## ✅ System Status
- Backend: Running on http://localhost:8000
- Frontend: Running on http://localhost:3000
- Database: Migration completed successfully
- API Endpoints: Available at `/api/notifications/`

## 🚀 Quick Start Guide

### Step 1: Get Discord Webhook URL

1. Open Discord and go to your server
2. Click on Server Settings (gear icon)
3. Go to **Integrations** → **Webhooks**
4. Click **New Webhook** or **Create Webhook**
5. Give it a name (e.g., "PingSight Alerts")
6. Select the channel where you want alerts
7. Click **Copy Webhook URL**
8. Keep this URL safe - you'll need it in the next step

**Example webhook URL format:**
```
https://discord.com/api/webhooks/1234567890/AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Step 2: Configure PingSight

1. Open your browser and go to: http://localhost:3000/dashboard/settings
2. Paste your Discord webhook URL in the input field
3. Toggle "Discord Notifications" to ON (blue)
4. Configure your alert preferences:
   - ✅ Alert on Monitor Down (recommended: ON)
   - ✅ Alert on Recovery (recommended: ON)
   - Set Alert Threshold (recommended: 1 for immediate alerts)
   - Set SSL Expiry Alert Days (recommended: 7 days)
   - Set Domain Expiry Alert Days (recommended: 7 days)
5. Click **"Send Test Notification"** button
6. Check your Discord channel - you should see a blue test message!
7. Click **"Save Settings"** to save your configuration

### Step 3: Test Real Alerts

#### Test Monitor Down Alert:
1. Go to http://localhost:3000/dashboard/monitors
2. Create a new monitor with a URL that will fail:
   - Name: "Test Down Alert"
   - URL: `http://this-will-definitely-fail-12345.com`
   - Type: Simple
   - Interval: 30 seconds
3. Wait 30 seconds
4. Check Discord - you should see a 🔴 RED alert!

#### Test Monitor Recovery Alert:
1. Edit the failed monitor
2. Change URL to a working one: `https://www.google.com`
3. Wait 30 seconds
4. Check Discord - you should see a ✅ GREEN recovery alert!

## 📱 What Alerts Look Like

### 🔴 Monitor Down Alert (Red)
```
🔴 ALERT: Monitor `Test Monitor` is DOWN!

Monitor: Test Monitor
URL: https://example.com
Type: SIMPLE
Interval: 30s
Error: Connection timeout

Timestamp: 2026-04-06T21:15:30Z
```

### ✅ Monitor Recovery Alert (Green)
```
✅ RECOVERED: Monitor `Test Monitor` is back online!

Monitor: Test Monitor
URL: https://example.com
Type: SIMPLE
Interval: 30s
Downtime: 2 minutes

Timestamp: 2026-04-06T21:17:45Z
```

### ⚠️ SSL Expiry Warning (Yellow)
```
⚠️ SSL WARNING: Certificate for `My Website` expires in 7 days!

Monitor: My Website
URL: https://example.com
Days Remaining: 7
Expiry Date: 2026-04-13

Timestamp: 2026-04-06T21:20:00Z
```

## 🎛️ Settings Explained

### Discord Webhook URL
- Your unique Discord webhook endpoint
- Must start with `https://discord.com/api/webhooks/`
- Keep this private - anyone with this URL can send messages to your channel

### Discord Enabled
- Master switch for all Discord notifications
- When OFF, no alerts will be sent (even if configured)
- When ON, alerts will be sent based on your preferences

### Alert on Down
- Send notification when monitor goes from UP → DOWN
- Recommended: ON
- Use case: Know immediately when your service is down

### Alert on Recovery
- Send notification when monitor goes from DOWN → UP
- Recommended: ON
- Use case: Know when your service is back online

### Alert Threshold
- Number of consecutive failures before sending alert
- Range: 1-10
- Default: 1 (alert immediately)
- Higher values prevent alert spam from transient issues
- Example: Set to 3 = only alert after 3 consecutive failures

### SSL Expiry Alert Days
- Days before SSL certificate expiry to send warning
- Range: 1-90 days
- Default: 7 days
- Alert sent once when days remaining matches this value
- Example: Set to 7 = alert when 7 days remain

### Domain Expiry Alert Days
- Days before domain registration expiry to send warning
- Range: 1-365 days
- Default: 7 days
- Alert sent once when days remaining matches this value
- Example: Set to 30 = alert when 30 days remain

## 🔧 Troubleshooting

### Test Notification Fails
**Error: "Discord webhook URL not configured"**
- Solution: Make sure you've pasted a webhook URL and enabled Discord

**Error: "Discord notifications are disabled"**
- Solution: Toggle the Discord Enabled switch to ON

**Error: "Failed to send test notification"**
- Solution: Check your webhook URL is correct
- Solution: Make sure the webhook hasn't been deleted in Discord
- Solution: Check your internet connection

### Not Receiving Alerts
1. **Check Discord is enabled**: Settings page → Discord toggle should be blue
2. **Check webhook URL**: Make sure it's correct and starts with `https://discord.com/api/webhooks/`
3. **Check alert preferences**: Make sure "Alert on Down" is enabled
4. **Check alert threshold**: If set to 3, monitor must fail 3 times before alerting
5. **Check backend logs**: Look for notification errors in terminal
6. **Test with test button**: Use "Send Test Notification" to verify webhook works

### Alerts Not Showing in Discord
1. **Check channel permissions**: Make sure the webhook has permission to post
2. **Check webhook exists**: Go to Discord → Server Settings → Integrations → Webhooks
3. **Check webhook channel**: Make sure it's posting to the right channel
4. **Regenerate webhook**: Delete old webhook and create a new one

### Too Many Alerts
1. **Increase alert threshold**: Set to 2-3 to require multiple failures
2. **Disable recovery alerts**: Turn off "Alert on Recovery" if too noisy
3. **Increase check interval**: Edit monitors to check less frequently

## 🔐 Security Best Practices

1. **Keep webhook URL private**: Don't share it publicly or commit to git
2. **Use environment variables**: Store webhook URL in .env file (future enhancement)
3. **Rotate webhooks**: Regenerate webhook URL if compromised
4. **Limit webhook permissions**: Only give webhook access to specific channel
5. **Monitor webhook usage**: Check Discord audit log for suspicious activity

## 📊 Monitoring Your Alerts

### Check Alert History
- Currently: Check Discord channel history
- Future: Alert history page in PingSight dashboard

### Alert Statistics
- Currently: Manual tracking in Discord
- Future: Alert analytics dashboard showing:
  - Total alerts sent
  - Alert frequency
  - Most problematic monitors
  - Alert response times

## 🎯 Best Practices

### For Production Use:
1. **Set alert threshold to 2-3**: Prevents false alarms from transient issues
2. **Enable both down and recovery alerts**: Know when problems start AND end
3. **Set SSL alerts to 30 days**: Gives you time to renew certificates
4. **Set domain alerts to 30 days**: Gives you time to renew domains
5. **Use dedicated alert channel**: Create #pingsight-alerts channel in Discord
6. **Test regularly**: Send test notifications monthly to verify setup

### For Development/Testing:
1. **Set alert threshold to 1**: Get immediate feedback
2. **Use separate webhook**: Don't spam production channels
3. **Shorter expiry warnings**: Test with 1-7 days for SSL/domain

## 🚀 Next Steps

1. ✅ Configure Discord webhook
2. ✅ Test notification system
3. ✅ Set up your monitors
4. ✅ Verify alerts are working
5. 📧 Future: Add email notifications
6. 📱 Future: Add Slack integration
7. 💬 Future: Add Telegram bot
8. 📞 Future: Add SMS alerts via Twilio

## 📞 Support

If you encounter issues:
1. Check backend logs: Terminal where uvicorn is running
2. Check frontend console: Browser DevTools → Console
3. Check Discord webhook: Test in Discord webhook settings
4. Check database: Verify settings are saved
5. Restart services: Stop and restart backend/frontend

## 🎉 You're All Set!

Your notification system is now configured and ready to alert you when:
- ❌ Monitors go down
- ✅ Monitors recover
- ⚠️ SSL certificates are expiring
- ⚠️ Domains are expiring

Stay informed and never miss a critical alert! 🚀
