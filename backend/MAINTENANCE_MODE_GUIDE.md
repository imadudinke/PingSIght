# Maintenance Mode - The Silent Shield

## Overview
Maintenance Mode allows you to temporarily pause monitoring during planned outages without affecting uptime statistics or triggering alerts. It's the professional way to handle database migrations, server updates, and scheduled maintenance.

---

## The Problem: Alert Fatigue

### Without Maintenance Mode
```
Scenario: Database migration (2 hours)
Result: 120 "SITE DOWN" alerts
Impact: Alert fatigue, false downtime stats, wasted time
```

### With Maintenance Mode
```
Scenario: Database migration (2 hours)
Action: Enable maintenance mode
Result: 0 alerts, monitoring paused, stats protected
Impact: Clean maintenance window, accurate uptime metrics
```

---

## Key Features

### 1. Manual Toggle
Turn maintenance mode on/off with a simple boolean flag:
```json
{
  "is_maintenance": true
}
```

### 2. Auto-Resume (Smart Feature)
Set an expiration time and monitoring automatically resumes:
```json
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T12:00:00Z"
}
```

### 3. Protected Uptime Stats
Maintenance time doesn't count against uptime percentage:
- **Wrong**: `uptime = successful_checks / total_checks`
- **Right**: Maintenance checks are skipped entirely (no heartbeats created)

---

## Database Schema

### Monitor Table Fields

```sql
ALTER TABLE monitors 
ADD COLUMN is_maintenance BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN maintenance_until TIMESTAMP WITH TIME ZONE NULL;
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `is_maintenance` | Boolean | Manual toggle for maintenance mode |
| `maintenance_until` | DateTime | Auto-resume time (optional) |

---

## API Usage

### Enable Maintenance Mode (Manual)

**Request:**
```bash
PUT /api/monitors/{monitor_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_maintenance": true
}
```

**Response:**
```json
{
  "id": "abc-123",
  "url": "https://example.com",
  "is_maintenance": true,
  "maintenance_until": null,
  "status": "UP"
}
```

### Enable Maintenance Mode (Auto-Resume)

**Request:**
```bash
PUT /api/monitors/{monitor_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T12:00:00Z"
}
```

**Response:**
```json
{
  "id": "abc-123",
  "url": "https://example.com",
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T12:00:00Z",
  "status": "UP"
}
```

### Disable Maintenance Mode

**Request:**
```bash
PUT /api/monitors/{monitor_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_maintenance": false
}
```

**Response:**
```json
{
  "id": "abc-123",
  "url": "https://example.com",
  "is_maintenance": false,
  "maintenance_until": null,
  "status": "UP"
}
```

---

## Worker Behavior

### The Silent Shield Logic

```python
async def perform_check(monitor_id, url, db):
    # Get monitor
    monitor = await db.get(monitor_id)
    
    # THE SILENT SHIELD
    if monitor.is_maintenance:
        # Check if auto-resume time has passed
        if monitor.maintenance_until and now > monitor.maintenance_until:
            # Auto-resume!
            monitor.is_maintenance = False
            monitor.maintenance_until = None
            await db.commit()
            logger.info("Maintenance expired. Resuming...")
        else:
            # Skip the check entirely
            logger.info("Skipping check: Maintenance Mode active")
            return {"status": "MAINTENANCE", "skipped": True}
    
    # Proceed with normal check...
    result = await perform_deep_check(url)
```

### What Happens During Maintenance

1. **Check Skipped**: No HTTP request made
2. **No Heartbeat**: No database record created
3. **No Alerts**: No notifications sent
4. **Stats Protected**: Uptime percentage unaffected
5. **Logs Updated**: Maintenance status logged

---

## Logging

### Maintenance Active (Manual)
```
[MAINTENANCE] 🛡️  Skipping check for https://example.com: Maintenance Mode active (manual)
```

### Maintenance Active (Auto-Resume)
```
[MAINTENANCE] 🛡️  Skipping check for https://example.com: Maintenance Mode active until 2026-04-01T12:00:00Z
```

### Auto-Resume Triggered
```
[MAINTENANCE] ✓ Maintenance expired for https://example.com. Resuming monitoring...
```

---

## Use Cases

### Use Case 1: Database Migration

**Scenario:** Migrating database, expected downtime 2 hours

**Steps:**
1. Enable maintenance mode with auto-resume:
```bash
PUT /api/monitors/{id}
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T14:00:00Z"  # 2 hours from now
}
```

2. Perform migration
3. System automatically resumes monitoring at 14:00

**Result:**
- 0 false alerts during migration
- Uptime stats remain accurate
- Automatic resume when done

### Use Case 2: Server Update

**Scenario:** Updating server software, downtime 30 minutes

**Steps:**
1. Enable maintenance mode:
```bash
PUT /api/monitors/{id}
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T10:30:00Z"
}
```

2. Update server
3. Monitoring resumes automatically

### Use Case 3: Emergency Maintenance

**Scenario:** Unexpected issue, need to pause monitoring immediately

**Steps:**
1. Enable maintenance mode (no expiration):
```bash
PUT /api/monitors/{id}
{
  "is_maintenance": true
}
```

2. Fix the issue
3. Manually disable when ready:
```bash
PUT /api/monitors/{id}
{
  "is_maintenance": false
}
```

### Use Case 4: Scheduled Maintenance Window

**Scenario:** Weekly maintenance every Sunday 2-4 AM

**Steps:**
1. Before maintenance:
```bash
PUT /api/monitors/{id}
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-07T04:00:00Z"
}
```

2. Maintenance happens
3. Auto-resume at 4 AM

---

## Frontend Integration

### Display Maintenance Status

**Monitor Card:**
```jsx
{monitor.is_maintenance && (
  <Badge color="blue">
    🛡️ Maintenance Mode
    {monitor.maintenance_until && (
      <span> until {formatDate(monitor.maintenance_until)}</span>
    )}
  </Badge>
)}
```

**Monitor Details:**
```jsx
{monitor.is_maintenance && (
  <Alert color="info">
    <AlertIcon />
    <AlertTitle>Maintenance Mode Active</AlertTitle>
    <AlertDescription>
      Monitoring is paused. 
      {monitor.maintenance_until ? (
        `Will resume automatically at ${formatDate(monitor.maintenance_until)}`
      ) : (
        'Resume manually when ready.'
      )}
    </AlertDescription>
  </Alert>
)}
```

### Toggle Maintenance Mode

**Quick Toggle:**
```jsx
<Switch
  isChecked={monitor.is_maintenance}
  onChange={(e) => toggleMaintenance(monitor.id, e.target.checked)}
>
  Maintenance Mode
</Switch>
```

**With Duration Picker:**
```jsx
<FormControl>
  <FormLabel>Maintenance Mode</FormLabel>
  <Switch
    isChecked={isMaintenanceEnabled}
    onChange={setIsMaintenanceEnabled}
  />
  
  {isMaintenanceEnabled && (
    <Select
      placeholder="Duration"
      onChange={(e) => setDuration(e.target.value)}
    >
      <option value="30">30 minutes</option>
      <option value="60">1 hour</option>
      <option value="120">2 hours</option>
      <option value="240">4 hours</option>
      <option value="manual">Manual (no auto-resume)</option>
    </Select>
  )}
  
  <Button onClick={applyMaintenance}>
    Apply
  </Button>
</FormControl>
```

---

## Uptime Calculation

### How It Works

Maintenance mode protects uptime stats by **not creating heartbeats** during maintenance:

**Without Maintenance Mode:**
```
Total checks: 100
Successful: 95
Failed: 5 (during maintenance)
Uptime: 95% ❌ (maintenance counted as downtime)
```

**With Maintenance Mode:**
```
Total checks: 95 (5 skipped during maintenance)
Successful: 95
Failed: 0
Uptime: 100% ✓ (maintenance excluded)
```

### Formula

```
Uptime % = (Successful Checks / Total Checks) * 100

Where:
- Total Checks = All heartbeats created
- Maintenance checks are NOT included (no heartbeats)
```

---

## Best Practices

### 1. Use Auto-Resume for Planned Maintenance
```bash
# Good: Set expiration time
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T14:00:00Z"
}

# Avoid: Manual mode for planned maintenance
{
  "is_maintenance": true  # Easy to forget to disable
}
```

### 2. Add Buffer Time
```bash
# If maintenance takes 1 hour, set 1.5 hours
{
  "maintenance_until": "2026-04-01T13:30:00Z"  # 30 min buffer
}
```

### 3. Document Maintenance Windows
Keep a log of maintenance windows for audit purposes:
```
2026-04-01 10:00-12:00: Database migration
2026-04-05 02:00-04:00: Server updates
2026-04-10 15:00-16:00: SSL certificate renewal
```

### 4. Test Before Production
Test maintenance mode on a test monitor first:
```bash
# Create test monitor
POST /api/monitors
{
  "url": "http://localhost:8001/normal",
  "friendly_name": "Maintenance Test"
}

# Enable maintenance
PUT /api/monitors/{id}
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T10:05:00Z"  # 5 min test
}

# Verify no heartbeats created
# Verify auto-resume works
```

---

## Monitoring Maintenance Mode

### Metrics to Track

1. **Maintenance frequency**: How often is maintenance mode used?
2. **Maintenance duration**: Average time in maintenance
3. **Auto-resume success rate**: % of auto-resumes that work
4. **Manual overrides**: How often users manually disable

### Logs to Monitor

```bash
# Count maintenance activations
grep "Maintenance Mode active" logs/app.log | wc -l

# Count auto-resumes
grep "Maintenance expired" logs/app.log | wc -l

# View maintenance activity
grep "MAINTENANCE" logs/app.log
```

---

## Comparison with Competitors

### Uptime Robot
- ⚠️  Has "pause monitoring" but no auto-resume
- ❌ Paused time still counts in stats

### Pingdom
- ✓ Has maintenance windows
- ⚠️  Complex configuration required
- ❌ No API for programmatic control

### PingSight (with Maintenance Mode)
- ✓ Simple boolean toggle
- ✓ Auto-resume with expiration time
- ✓ Stats automatically protected
- ✓ Full API control
- ✓ Detailed logging
- ✓ Works for all monitor types

---

## Testing

### Test Case 1: Manual Maintenance

```bash
# 1. Create monitor
POST /api/monitors
{
  "url": "http://localhost:8001/normal",
  "friendly_name": "Maintenance Test",
  "interval_seconds": 30
}

# 2. Enable maintenance
PUT /api/monitors/{id}
{
  "is_maintenance": true
}

# 3. Wait 60 seconds (2 check intervals)

# 4. Verify no new heartbeats created
GET /api/monitors/{id}
# Should show same heartbeat count

# 5. Check logs
grep "Maintenance Mode active" logs/app.log

# 6. Disable maintenance
PUT /api/monitors/{id}
{
  "is_maintenance": false
}

# 7. Wait 30 seconds

# 8. Verify monitoring resumed
GET /api/monitors/{id}
# Should show new heartbeat
```

### Test Case 2: Auto-Resume

```bash
# 1. Enable maintenance with 2-minute expiration
PUT /api/monitors/{id}
{
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T10:02:00Z"  # 2 min from now
}

# 2. Wait 2.5 minutes

# 3. Check logs for auto-resume
grep "Maintenance expired" logs/app.log

# 4. Verify monitoring resumed
GET /api/monitors/{id}
# is_maintenance should be false
# Should have new heartbeats
```

---

## Troubleshooting

### Issue: Maintenance not ending automatically

**Check:**
```bash
# Verify maintenance_until is in the future
GET /api/monitors/{id}

# Check server time
date -u

# Check logs
grep "Maintenance expired" logs/app.log
```

**Solution:**
- Ensure `maintenance_until` is in UTC
- Verify server clock is correct
- Check if monitor is being checked (is_active = true)

### Issue: Heartbeats still being created

**Check:**
```bash
# Verify is_maintenance is true
GET /api/monitors/{id}

# Check database
SELECT is_maintenance, maintenance_until FROM monitors WHERE id = '{id}';
```

**Solution:**
- Restart backend server
- Verify migration ran successfully
- Check worker logs for errors

---

## Summary

Maintenance Mode is now fully implemented! The system:

✓ Prevents false alerts during planned outages
✓ Protects uptime statistics
✓ Supports manual and auto-resume modes
✓ Logs all maintenance activity
✓ Works for simple and scenario monitors
✓ Provides full API control
✓ No heartbeats created during maintenance

This is a professional, production-ready feature that prevents alert fatigue and maintains accurate uptime metrics!
