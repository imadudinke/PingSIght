# Maintenance Mode API Reference

## Overview
Dedicated REST endpoints for managing maintenance mode on monitors. These endpoints provide a clean, intuitive API for pausing and resuming monitoring.

---

## Endpoints

### 1. Enable Maintenance Mode

**Endpoint:** `POST /api/monitors/{monitor_id}/maintenance/enable`

**Description:** Enable maintenance mode for a monitor. Supports both manual and auto-resume modes.

**Authentication:** Required (Bearer token)

#### Request

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (Optional):**
```json
{
  "duration_minutes": 120
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `duration_minutes` | Integer | No | Auto-resume after N minutes (1-10080) |

#### Response

**Status:** `200 OK`

**Body:**
```json
{
  "id": "abc-123",
  "user_id": "user-456",
  "url": "https://example.com",
  "friendly_name": "My Website",
  "interval_seconds": 60,
  "status": "UP",
  "is_active": true,
  "last_checked": "2026-04-01T10:00:00Z",
  "created_at": "2026-04-01T09:00:00Z",
  "monitor_type": "simple",
  "steps": null,
  "ssl_status": "valid",
  "ssl_expiry_date": "2027-04-01T00:00:00Z",
  "ssl_days_remaining": 365,
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T12:00:00Z"
}
```

#### Examples

**Manual Mode (No Auto-Resume):**
```bash
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Auto-Resume in 1 Hour:**
```bash
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 60}'
```

**Auto-Resume in 2 Hours:**
```bash
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 120}'
```

**Auto-Resume in 30 Minutes:**
```bash
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 30}'
```

---

### 2. Disable Maintenance Mode

**Endpoint:** `POST /api/monitors/{monitor_id}/maintenance/disable`

**Description:** Disable maintenance mode and resume monitoring immediately.

**Authentication:** Required (Bearer token)

#### Request

**Headers:**
```
Authorization: Bearer {token}
```

**Body:** None

#### Response

**Status:** `200 OK`

**Body:**
```json
{
  "id": "abc-123",
  "user_id": "user-456",
  "url": "https://example.com",
  "friendly_name": "My Website",
  "interval_seconds": 60,
  "status": "UP",
  "is_active": true,
  "last_checked": "2026-04-01T10:00:00Z",
  "created_at": "2026-04-01T09:00:00Z",
  "monitor_type": "simple",
  "steps": null,
  "ssl_status": "valid",
  "ssl_expiry_date": "2027-04-01T00:00:00Z",
  "ssl_days_remaining": 365,
  "is_maintenance": false,
  "maintenance_until": null
}
```

#### Example

```bash
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/disable \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Error Responses

**Monitor Not in Maintenance:**
```json
{
  "detail": "Monitor is not in maintenance mode"
}
```
Status: `400 Bad Request`

---

### 3. Get Maintenance Status

**Endpoint:** `GET /api/monitors/{monitor_id}/maintenance/status`

**Description:** Get current maintenance mode status and time remaining.

**Authentication:** Required (Bearer token)

#### Request

**Headers:**
```
Authorization: Bearer {token}
```

#### Response

**Status:** `200 OK`

**Body:**
```json
{
  "monitor_id": "abc-123",
  "monitor_name": "My Website",
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T12:00:00Z",
  "time_remaining_minutes": 45,
  "mode": "auto-resume"
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `monitor_id` | UUID | Monitor identifier |
| `monitor_name` | String | Monitor friendly name |
| `is_maintenance` | Boolean | Whether maintenance is active |
| `maintenance_until` | DateTime | Auto-resume time (null if manual) |
| `time_remaining_minutes` | Integer | Minutes until auto-resume (null if manual) |
| `mode` | String | "active", "manual", or "auto-resume" |

#### Examples

**Active Monitoring:**
```json
{
  "monitor_id": "abc-123",
  "monitor_name": "My Website",
  "is_maintenance": false,
  "maintenance_until": null,
  "time_remaining_minutes": null,
  "mode": "active"
}
```

**Manual Maintenance:**
```json
{
  "monitor_id": "abc-123",
  "monitor_name": "My Website",
  "is_maintenance": true,
  "maintenance_until": null,
  "time_remaining_minutes": null,
  "mode": "manual"
}
```

**Auto-Resume Maintenance:**
```json
{
  "monitor_id": "abc-123",
  "monitor_name": "My Website",
  "is_maintenance": true,
  "maintenance_until": "2026-04-01T12:00:00Z",
  "time_remaining_minutes": 45,
  "mode": "auto-resume"
}
```

**Example Request:**
```bash
curl http://localhost:8000/api/monitors/abc-123/maintenance/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Use Cases

### Use Case 1: Quick Maintenance (30 minutes)

```bash
# Enable for 30 minutes
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 30}'

# System automatically resumes after 30 minutes
```

### Use Case 2: Database Migration (2 hours)

```bash
# Enable for 2 hours
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 120}'

# Perform migration...
# System automatically resumes after 2 hours
```

### Use Case 3: Emergency Maintenance (Unknown Duration)

```bash
# Enable manual mode (no auto-resume)
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/enable \
  -H "Authorization: Bearer $TOKEN"

# Fix the issue...

# Manually disable when ready
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/disable \
  -H "Authorization: Bearer $TOKEN"
```

### Use Case 4: Check Status Before Disabling

```bash
# Check current status
curl http://localhost:8000/api/monitors/abc-123/maintenance/status \
  -H "Authorization: Bearer $TOKEN"

# If time_remaining_minutes > 0, you can wait
# Or disable manually if done early
curl -X POST http://localhost:8000/api/monitors/abc-123/maintenance/disable \
  -H "Authorization: Bearer $TOKEN"
```

---

## Duration Presets

Common duration values for convenience:

| Duration | Minutes | Use Case |
|----------|---------|----------|
| 15 min | 15 | Quick restart |
| 30 min | 30 | Minor update |
| 1 hour | 60 | Standard maintenance |
| 2 hours | 120 | Database migration |
| 4 hours | 240 | Major update |
| 8 hours | 480 | Overnight maintenance |
| 24 hours | 1440 | Full day maintenance |
| 1 week | 10080 | Extended maintenance |

---

## Error Responses

### 400 Bad Request

**Invalid Duration:**
```json
{
  "detail": "duration_minutes must be between 1 and 10080"
}
```

**Not in Maintenance:**
```json
{
  "detail": "Monitor is not in maintenance mode"
}
```

### 404 Not Found

**Monitor Not Found:**
```json
{
  "detail": "Monitor not found"
}
```

### 401 Unauthorized

**Missing/Invalid Token:**
```json
{
  "detail": "Not authenticated"
}
```

### 500 Internal Server Error

**Database Error:**
```json
{
  "detail": "Database error occurred"
}
```

---

## Frontend Integration

### React/TypeScript Example

```typescript
// Enable maintenance for 2 hours
const enableMaintenance = async (monitorId: string, durationMinutes?: number) => {
  const response = await fetch(
    `${API_URL}/monitors/${monitorId}/maintenance/enable`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: durationMinutes ? JSON.stringify({ duration_minutes: durationMinutes }) : undefined
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to enable maintenance mode');
  }
  
  return await response.json();
};

// Disable maintenance
const disableMaintenance = async (monitorId: string) => {
  const response = await fetch(
    `${API_URL}/monitors/${monitorId}/maintenance/disable`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to disable maintenance mode');
  }
  
  return await response.json();
};

// Get status
const getMaintenanceStatus = async (monitorId: string) => {
  const response = await fetch(
    `${API_URL}/monitors/${monitorId}/maintenance/status`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get maintenance status');
  }
  
  return await response.json();
};

// Usage
await enableMaintenance('abc-123', 120); // 2 hours
await disableMaintenance('abc-123');
const status = await getMaintenanceStatus('abc-123');
```

### UI Component Example

```jsx
function MaintenanceControl({ monitor }) {
  const [status, setStatus] = useState(null);
  const [duration, setDuration] = useState(60);
  
  const handleEnable = async () => {
    await enableMaintenance(monitor.id, duration);
    await refreshStatus();
  };
  
  const handleDisable = async () => {
    await disableMaintenance(monitor.id);
    await refreshStatus();
  };
  
  const refreshStatus = async () => {
    const newStatus = await getMaintenanceStatus(monitor.id);
    setStatus(newStatus);
  };
  
  return (
    <div>
      {status?.is_maintenance ? (
        <div>
          <Badge color="blue">Maintenance Mode</Badge>
          {status.time_remaining_minutes && (
            <span>{status.time_remaining_minutes} minutes remaining</span>
          )}
          <Button onClick={handleDisable}>Resume Monitoring</Button>
        </div>
      ) : (
        <div>
          <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
          </Select>
          <Button onClick={handleEnable}>Enable Maintenance</Button>
        </div>
      )}
    </div>
  );
}
```

---

## Testing

### Test Enable (Manual)

```bash
curl -X POST http://localhost:8000/api/monitors/{ID}/maintenance/enable \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

Expected: `200 OK`, `is_maintenance: true`, `maintenance_until: null`

### Test Enable (Auto-Resume)

```bash
curl -X POST http://localhost:8000/api/monitors/{ID}/maintenance/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 2}' \
  -v
```

Expected: `200 OK`, `is_maintenance: true`, `maintenance_until` set to 2 minutes from now

Wait 2.5 minutes, then check logs:
```bash
grep "Maintenance expired" backend/logs/app.log
```

### Test Disable

```bash
curl -X POST http://localhost:8000/api/monitors/{ID}/maintenance/disable \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

Expected: `200 OK`, `is_maintenance: false`, `maintenance_until: null`

### Test Status

```bash
curl http://localhost:8000/api/monitors/{ID}/maintenance/status \
  -H "Authorization: Bearer $TOKEN" | jq
```

Expected: JSON with current maintenance status

---

## Best Practices

### 1. Use Auto-Resume for Planned Maintenance
```bash
# Good: Set duration
POST /maintenance/enable {"duration_minutes": 120}

# Avoid: Manual mode for planned work
POST /maintenance/enable  # Easy to forget to disable
```

### 2. Check Status Before Operations
```bash
# Check if already in maintenance
GET /maintenance/status

# Then enable/disable as needed
```

### 3. Add Buffer Time
```bash
# If work takes 1 hour, set 1.5 hours
{"duration_minutes": 90}
```

### 4. Log Maintenance Windows
Keep audit trail of maintenance operations for compliance.

---

## Summary

The maintenance mode API provides:

✓ **Clean REST endpoints** for pause/resume operations
✓ **Flexible duration** from 1 minute to 1 week
✓ **Status endpoint** to check current state
✓ **Auto-resume** for planned maintenance
✓ **Manual mode** for emergency situations
✓ **Detailed responses** with all monitor information

These endpoints make it easy to integrate maintenance mode into any frontend or automation system!
