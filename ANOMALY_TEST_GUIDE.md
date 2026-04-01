# Anomaly Detection Testing Guide

## Quick Start

This guide will help you test the anomaly detection functionality using a local test server.

---

## Prerequisites

1. PingSight backend running on port 8000
2. Python 3.8+ installed
3. User account created in PingSight

---

## Step 1: Start the Test Server

The test server provides endpoints with different latency characteristics:

```bash
python test_anomaly_server.py
```

You should see:
```
🚀 Starting Anomaly Test Server on http://localhost:8001

Available Endpoints:
  GET /fast          - Fast endpoint (50-100ms)
  GET /normal        - Normal endpoint (200-400ms)
  GET /slow          - Slow endpoint (2000-3000ms) ⚠️
  GET /random        - Random (80% fast, 20% slow)
  GET /custom?delay_ms=500 - Custom delay
  GET /simulate-issue - Simulates temporary issue
```

**Keep this terminal open!**

---

## Step 2: Test the Endpoints Manually

Open a new terminal and test the endpoints:

```bash
# Fast endpoint (should be quick)
curl http://localhost:8001/fast

# Normal endpoint (200-400ms)
curl http://localhost:8001/normal

# Slow endpoint (2000-3000ms - should trigger anomaly!)
curl http://localhost:8001/slow

# Check statistics
curl http://localhost:8001/stats
```

---

## Step 3: Run the Automated Test

### Option A: Automated Test Script

```bash
python test_anomaly_detection.py
```

This script will:
1. Login to PingSight API
2. Create 3 monitors (normal, random, slow)
3. Wait for 12 checks (~6 minutes)
4. Analyze results and verify anomaly detection

**Note:** Update the login credentials in the script if needed:
```python
# In test_anomaly_detection.py, line ~40
response = requests.post(
    f"{API_BASE_URL}/auth/login",
    json={
        "email": "your-email@example.com",  # Update this
        "password": "your-password"          # Update this
    }
)
```

### Option B: Manual Testing

1. **Create a monitor via API:**

```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/normal",
    "friendly_name": "Test Normal",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

2. **Wait for 10+ checks** (about 5 minutes)

3. **Check the results:**

```bash
curl http://localhost:8000/api/monitors/{MONITOR_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Look for anomalies in the response:**

```json
{
  "recent_heartbeats": [
    {
      "id": 1,
      "latency_ms": 2500,
      "is_anomaly": true,  // ← This should be true for slow checks!
      "created_at": "2026-04-01T08:00:00Z"
    }
  ]
}
```

---

## Step 4: Create Different Test Scenarios

### Scenario 1: Normal Baseline (No Anomalies)

Monitor the `/normal` endpoint:
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/normal",
    "friendly_name": "Normal Endpoint",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

**Expected:** No anomalies (latency stays 200-400ms)

### Scenario 2: Consistent Slowness (Many Anomalies)

Monitor the `/slow` endpoint:
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/slow",
    "friendly_name": "Slow Endpoint",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

**Expected:** Most checks flagged as anomalies (2000-3000ms vs baseline)

### Scenario 3: Intermittent Issues (Some Anomalies)

Monitor the `/random` endpoint:
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/random",
    "friendly_name": "Random Endpoint",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

**Expected:** ~20% of checks flagged as anomalies

### Scenario 4: Simulated Real-World Issue

Monitor the `/simulate-issue` endpoint:
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/simulate-issue",
    "friendly_name": "Simulated Issue",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

**Expected:** 
- Checks 1-5: Normal (200-400ms)
- Checks 6-10: Anomalies (2000-3000ms)
- Checks 11+: Back to normal

---

## Step 5: Verify in Database

Check the database directly to see anomaly flags:

```bash
PGPASSWORD=12345678 psql -h localhost -U imtech -d ping_sight -c "
SELECT 
    h.id,
    m.name as monitor_name,
    h.latency_ms,
    h.is_anomaly,
    h.created_at
FROM heartbeats h
JOIN monitors m ON h.monitor_id = m.id
WHERE m.name LIKE 'Test%'
ORDER BY h.created_at DESC
LIMIT 20;
"
```

You should see:
```
 id  | monitor_name  | latency_ms | is_anomaly |     created_at
-----+---------------+------------+------------+---------------------
 123 | Test Normal   |     350.5  | f          | 2026-04-01 08:05:00
 124 | Test Slow     |    2500.0  | t          | 2026-04-01 08:05:00
 125 | Test Random   |     400.0  | f          | 2026-04-01 08:04:30
 126 | Test Random   |    2800.0  | t          | 2026-04-01 08:04:00
```

---

## Step 6: Check Logs

Watch the backend logs for anomaly detection messages:

```bash
# In the backend directory
tail -f logs/app.log | grep ANOMALY
```

You should see:
```
[ANOMALY] ✓ Normal latency for monitor abc-123: 350.50ms (avg: 320.00ms)
[ANOMALY] ⚠️  Anomaly detected for monitor xyz-789! Current: 2500.00ms vs Average: 400.00ms (3x threshold exceeded)
```

---

## Understanding the Results

### What is_anomaly: true Means

When `is_anomaly` is `true`, it means:
- Current latency is **3x or more** than the average of the last 10 checks
- This indicates a performance degradation
- The site is technically "up" but behaving abnormally

### Example Calculation

```
Last 10 checks: 300, 320, 280, 310, 290, 305, 315, 295, 300, 310
Average: 302.5ms

Current check: 1200ms
Ratio: 1200 / 302.5 = 3.97x
Result: is_anomaly = true (exceeds 3x threshold)
```

---

## Troubleshooting

### Issue: No anomalies detected on slow endpoint

**Possible causes:**
1. Not enough baseline data (need 10+ checks)
2. Server not restarted after migration
3. Anomaly detection code not active

**Solutions:**
```bash
# Check if migration ran
cd backend
alembic current

# Should show: 4459b3fd5568 (head)

# Restart backend server
# Stop current server (Ctrl+C)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: All checks showing as anomalies

**Possible cause:** Baseline not established yet

**Solution:** Wait for 10+ checks to build a stable baseline

### Issue: Test server not accessible

**Check if it's running:**
```bash
curl http://localhost:8001/health
```

**If not running:**
```bash
python test_anomaly_server.py
```

---

## Advanced Testing

### Custom Delay Testing

Test specific latency values:

```bash
# 500ms (should be normal)
curl "http://localhost:8001/custom?delay_ms=500"

# 2000ms (should trigger anomaly after baseline)
curl "http://localhost:8001/custom?delay_ms=2000"
```

Create a monitor for custom endpoint:
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/custom?delay_ms=300",
    "friendly_name": "Custom Delay Test",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

Then manually trigger slow responses:
```bash
# Change the delay on the test server
# The monitor will detect the change as an anomaly
```

---

## Expected Timeline

```
Time    | Checks | Status
--------|--------|------------------------------------------
0:00    | 0      | Monitor created
0:30    | 1      | First check (no anomaly - no baseline)
1:00    | 2      | Building baseline...
1:30    | 3      | Building baseline...
...     | ...    | ...
5:00    | 10     | Baseline established
5:30    | 11     | Anomaly detection active!
6:00    | 12     | Anomalies can now be detected
```

---

## Success Criteria

✓ Slow endpoint shows `is_anomaly: true` for most checks
✓ Normal endpoint shows `is_anomaly: false` for most checks
✓ Random endpoint shows mix of true/false (~20% true)
✓ Logs show anomaly warnings for slow checks
✓ Database has `is_anomaly` column populated correctly

---

## Cleanup

After testing, delete the test monitors:

```bash
# Get monitor IDs
curl http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete each test monitor
curl -X DELETE http://localhost:8000/api/monitors/{MONITOR_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Stop the test server:
```bash
# In the test server terminal, press Ctrl+C
```

---

## Summary

This test setup allows you to:
1. Verify anomaly detection works correctly
2. Test different latency scenarios
3. See real-time anomaly flags in API responses
4. Validate the 3x rule implementation
5. Confirm database storage of anomaly flags

The test server provides controlled endpoints to simulate real-world performance issues!
