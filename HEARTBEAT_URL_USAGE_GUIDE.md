# Heartbeat URL Usage Guide

## Fixed Issue

**Problem**: Heartbeat URL was showing as `heartbeat://...` instead of a proper HTTP URL.

**Solution**: Updated the backend to generate full URLs using the `BACKEND_URL` configuration.

## Correct URL Format

When you create a heartbeat monitor, you'll now receive a proper URL like:

```
http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff
```

Or in production:
```
https://pingsight.com/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff
```

## Configuration

### Backend Configuration (.env)

Add this to your `backend/.env` file:

```bash
# Backend URL (used for generating heartbeat URLs)
BACKEND_URL=http://localhost:8000
```

**For Production**:
```bash
BACKEND_URL=https://api.pingsight.com
# or
BACKEND_URL=https://pingsight.com
```

### How It Works

1. **Settings** (`backend/app/core/config.py`):
   ```python
   class Settings(BaseSettings):
       backend_url: str = "http://localhost:8000"
   ```

2. **URL Generation** (`backend/app/api/monitors.py`):
   ```python
   def _heartbeat_url_for_monitor(monitor: Monitor) -> Optional[str]:
       if monitor.monitor_type != "heartbeat":
           return None
       return f"{settings.backend_url}/api/heartbeats/{monitor.id}"
   ```

3. **API Response**:
   ```json
   {
     "id": "5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff",
     "monitor_type": "heartbeat",
     "heartbeat_url": "http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff"
   }
   ```

## Usage Examples

### 1. Simple Curl Command

```bash
#!/bin/bash

# Your script logic
python3 backup_database.py

# Ping PingSight on success
curl http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff
```

### 2. With Error Handling

```bash
#!/bin/bash

# Run backup
if python3 backup_database.py; then
    # Success - send heartbeat
    curl http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff
else
    # Failure - don't send heartbeat (silence is the alarm!)
    echo "Backup failed!"
    exit 1
fi
```

### 3. Cron Job

```bash
# Crontab entry - runs daily at 2 AM
0 2 * * * /scripts/backup.sh && curl http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff
```

### 4. Python Script

```python
import requests

HEARTBEAT_URL = "http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff"

def main():
    try:
        # Your task logic
        process_data()
        
        # Send heartbeat on success
        requests.get(HEARTBEAT_URL, timeout=5)
        print("Heartbeat sent successfully")
    except Exception as e:
        # Don't send heartbeat on failure
        print(f"Task failed: {e}")
        raise

if __name__ == "__main__":
    main()
```

### 5. Node.js Script

```javascript
const axios = require('axios');

const HEARTBEAT_URL = 'http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff';

async function main() {
  try {
    // Your task logic
    await processData();
    
    // Send heartbeat on success
    await axios.get(HEARTBEAT_URL);
    console.log('Heartbeat sent successfully');
  } catch (error) {
    // Don't send heartbeat on failure
    console.error('Task failed:', error);
    process.exit(1);
  }
}

main();
```

### 6. PowerShell (Windows)

```powershell
# Your script logic
python backup_database.py

# Send heartbeat on success
if ($LASTEXITCODE -eq 0) {
    Invoke-WebRequest -Uri "http://localhost:8000/api/heartbeats/5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff"
}
```

## Testing the URL

### 1. Manual Test

```bash
# Send a test ping
curl http://localhost:8000/api/heartbeats/YOUR-MONITOR-ID

# Expected response:
{
  "success": true,
  "message": "Heartbeat received",
  "monitor_id": "5d4ce9f2-10f3-4cb9-8309-f250f54bb4ff",
  "received_at": "2024-01-15T10:30:00Z",
  "next_expected_at": "2024-01-16T10:30:00Z"
}
```

### 2. Check Monitor Status

```bash
# Get monitor details
curl http://localhost:8000/monitors/YOUR-MONITOR-ID \
  -H "Authorization: Bearer YOUR-TOKEN"

# Check last_ping_received and status fields
```

### 3. Test Missed Heartbeat

```bash
# 1. Send a ping
curl http://localhost:8000/api/heartbeats/YOUR-MONITOR-ID

# 2. Wait for (interval + grace_period) seconds
# For example: 60s interval + 300s grace = 360s total

# 3. Check status - should be DOWN
curl http://localhost:8000/monitors/YOUR-MONITOR-ID \
  -H "Authorization: Bearer YOUR-TOKEN"
```

## Frontend Display

The heartbeat URL is displayed in the monitor detail page:

```tsx
{monitor.monitor_type === 'heartbeat' && monitor.heartbeat_url && (
  <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
    <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
      HEARTBEAT_URL
    </div>
    
    <div className="flex items-center gap-3">
      <code className="flex-1 px-3 py-2 bg-[#0f1113] border border-[#1f2227] text-[#f2d48a] text-[11px] font-mono">
        {monitor.heartbeat_url}
      </code>
      
      <button
        onClick={() => navigator.clipboard.writeText(monitor.heartbeat_url)}
        className="px-3 py-2 border border-[#2a2d31] hover:border-[#3a3d42] text-[10px] tracking-[0.26em] uppercase"
      >
        COPY
      </button>
    </div>
    
    <div className="mt-3 text-[#6f6f6f] text-[10px] tracking-[0.18em]">
      Add this URL to your script: curl {monitor.heartbeat_url}
    </div>
  </div>
)}
```

## Security Considerations

### 1. Monitor ID as Secret
- The monitor ID (UUID) acts as the authentication token
- Keep it secret - anyone with the URL can send pings
- Don't commit to public repositories

### 2. HTTPS in Production
Always use HTTPS in production:
```bash
BACKEND_URL=https://pingsight.com
```

### 3. Rate Limiting (Future)
Consider adding rate limiting to prevent abuse:
```python
@limiter.limit("100/minute")
async def receive_heartbeat(monitor_id: UUID):
    ...
```

### 4. IP Whitelisting (Future)
Allow pings only from specific IPs:
```python
ALLOWED_IPS = ["192.168.1.100", "10.0.0.50"]
```

## Troubleshooting

### Issue: URL shows as `heartbeat://...`

**Cause**: Old code that returned only the path

**Solution**: 
1. Update `backend/app/core/config.py` to include `backend_url`
2. Update `backend/app/api/monitors.py` to use full URL
3. Add `BACKEND_URL` to `.env` file
4. Restart backend server

### Issue: 404 Not Found

**Cause**: Incorrect URL or monitor doesn't exist

**Solution**:
1. Verify monitor ID is correct
2. Check monitor exists: `GET /monitors/{id}`
3. Verify monitor type is "heartbeat"

### Issue: 400 Bad Request

**Cause**: Monitor is not a heartbeat type

**Solution**: Only heartbeat monitors can receive pings

### Issue: 409 Conflict

**Causes**:
- Monitor is inactive (`is_active = false`)
- Monitor is in maintenance mode (`is_maintenance = true`)

**Solution**: Activate monitor or disable maintenance mode

## Production Deployment

### Environment Variables

```bash
# Production .env
BACKEND_URL=https://api.pingsight.com
FRONTEND_URL=https://pingsight.com
```

### Nginx Configuration

```nginx
# Proxy heartbeat endpoint
location /api/heartbeats/ {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Docker Compose

```yaml
services:
  backend:
    environment:
      - BACKEND_URL=https://api.pingsight.com
      - FRONTEND_URL=https://pingsight.com
```

## Monitoring the Heartbeat System

### Check Watcher Status

```bash
# Get scheduler status
curl http://localhost:8000/status/scheduler \
  -H "Authorization: Bearer YOUR-TOKEN"
```

### View Logs

```bash
# Backend logs
tail -f backend.log | grep HEARTBEAT_WATCHER

# Look for:
# - "Starting heartbeat monitor check..."
# - "MISSED HEARTBEAT: Monitor..."
# - "Monitor back UP..."
```

### Database Queries

```sql
-- Check heartbeat monitors
SELECT id, name, monitor_type, last_ping_received, last_status
FROM monitors
WHERE monitor_type = 'heartbeat';

-- Check recent heartbeat records
SELECT monitor_id, status_code, error_message, created_at
FROM heartbeats
WHERE monitor_id = 'YOUR-MONITOR-ID'
ORDER BY created_at DESC
LIMIT 10;
```

## Summary

✅ **Fixed**: Heartbeat URL now shows as proper HTTP/HTTPS URL
✅ **Configuration**: Added `BACKEND_URL` to settings
✅ **Usage**: Simple curl command in scripts
✅ **Security**: Monitor ID acts as secret token
✅ **Production**: Use HTTPS and proper domain

The heartbeat URL is now correctly formatted and ready to use in your scripts!
