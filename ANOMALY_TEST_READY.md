# ✅ Anomaly Detection Test - Ready to Run!

## Current Status

✓ Test server running on http://localhost:8001
✓ Backend server should be running on http://localhost:8000
✓ Test scripts created and ready

---

## Test Server Endpoints

The test server is now running with these endpoints:

| Endpoint | Latency | Purpose |
|----------|---------|---------|
| `/normal` | 200-400ms | Baseline (no anomalies expected) |
| `/slow` | 2000-3000ms | Trigger anomalies (5-10x slower) |
| `/random` | Mixed | 80% normal, 20% slow |
| `/fast` | 50-100ms | Very fast responses |
| `/custom?delay_ms=X` | Custom | Test specific latencies |

---

## Quick Test (Automated)

Run the automated test script:

```bash
./quick_anomaly_test.sh
```

This will:
1. Check if test server is running ✓
2. Login to PingSight API
3. Create 2 monitors (normal and slow)
4. Wait for first check
5. Show initial results
6. Provide commands to check progress

---

## Manual Test Steps

### 1. Verify Test Server

```bash
curl http://localhost:8001/health
```

Expected:
```json
{"status":"healthy","service":"Anomaly Test Server","port":8001}
```

### 2. Test Endpoints

```bash
# Normal endpoint (200-400ms)
curl http://localhost:8001/normal

# Slow endpoint (2000-3000ms)
curl http://localhost:8001/slow
```

### 3. Create Monitors via API

**Get your auth token first:**
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Save the token
TOKEN="your-token-here"
```

**Create Normal Monitor:**
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/normal",
    "friendly_name": "Test Normal",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

**Create Slow Monitor:**
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/slow",
    "friendly_name": "Test Slow",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

### 4. Wait for Baseline

⏱️ **Wait 5-6 minutes** for 10+ checks to establish baseline

### 5. Check Results

```bash
# Get monitor details
curl http://localhost:8000/api/monitors/{MONITOR_ID} \
  -H "Authorization: Bearer $TOKEN" | jq '.recent_heartbeats[] | {latency_ms, is_anomaly}'
```

**Expected for Normal Monitor:**
```json
{
  "latency_ms": 350.5,
  "is_anomaly": false
}
```

**Expected for Slow Monitor (after baseline):**
```json
{
  "latency_ms": 2500.0,
  "is_anomaly": true  // ← Should be true!
}
```

---

## Verification Checklist

### After 10+ Checks (5-6 minutes)

- [ ] Normal endpoint: `is_anomaly: false` for most checks
- [ ] Slow endpoint: `is_anomaly: true` for most checks
- [ ] Logs show anomaly warnings
- [ ] Database has `is_anomaly` column populated

### Check Logs

```bash
tail -f backend/logs/app.log | grep ANOMALY
```

Expected output:
```
[ANOMALY] ✓ Normal latency for monitor abc-123: 350.50ms (avg: 320.00ms)
[ANOMALY] ⚠️  Anomaly detected for monitor xyz-789! Current: 2500.00ms vs Average: 400.00ms (3x threshold exceeded)
```

### Check Database

```bash
cd backend
PGPASSWORD=12345678 psql -h localhost -U imtech -d ping_sight -c "
SELECT 
    m.name,
    h.latency_ms,
    h.is_anomaly,
    h.created_at
FROM heartbeats h
JOIN monitors m ON h.monitor_id = m.id
WHERE m.name LIKE 'Test%'
ORDER BY h.created_at DESC
LIMIT 10;
"
```

Expected:
```
     name      | latency_ms | is_anomaly |     created_at
---------------+------------+------------+---------------------
 Test Normal   |     350.5  | f          | 2026-04-01 09:05:00
 Test Slow     |    2500.0  | t          | 2026-04-01 09:05:00
 Test Normal   |     320.0  | f          | 2026-04-01 09:04:30
 Test Slow     |    2700.0  | t          | 2026-04-01 09:04:30
```

---

## Understanding the Results

### The 3x Rule

```
if current_latency > (average_of_last_10 * 3):
    is_anomaly = true
```

### Example for Slow Endpoint

```
Check 1-10: Building baseline
  Average: ~300ms (normal endpoint gets checked first)

Check 11: Slow endpoint = 2500ms
  Calculation: 2500 / 300 = 8.3x
  Result: is_anomaly = true ✓

Check 12: Slow endpoint = 2700ms
  New average: ~500ms (includes previous slow checks)
  Calculation: 2700 / 500 = 5.4x
  Result: is_anomaly = true ✓
```

---

## Timeline

```
Time    | Checks | Status
--------|--------|------------------------------------------
0:00    | 0      | Monitors created
0:30    | 1      | First check (no anomaly - no baseline)
1:00    | 2      | Building baseline...
1:30    | 3      | Building baseline...
2:00    | 4      | Building baseline...
2:30    | 5      | Building baseline...
3:00    | 6      | Building baseline...
3:30    | 7      | Building baseline...
4:00    | 8      | Building baseline...
4:30    | 9      | Building baseline...
5:00    | 10     | Baseline established ✓
5:30    | 11     | Anomaly detection ACTIVE!
6:00    | 12     | Anomalies detected on slow endpoint ✓
```

---

## Troubleshooting

### Issue: Test server not accessible

```bash
# Check if running
curl http://localhost:8001/health

# If not, check the process
ps aux | grep test_anomaly_server

# Restart if needed
source backend/.venv/bin/activate
python test_anomaly_server.py
```

### Issue: No anomalies detected

**Possible causes:**
1. Not enough checks yet (need 10+)
2. Backend not restarted after migration
3. Wrong endpoint being monitored

**Solutions:**
```bash
# Check migration status
cd backend
alembic current
# Should show: 4459b3fd5568 (head)

# Restart backend
# Stop current server (Ctrl+C)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Wait for 10+ checks
```

### Issue: All checks showing as anomalies

**Cause:** Baseline not stable yet

**Solution:** Wait for more checks (15-20) to stabilize

---

## Advanced Testing

### Test Different Scenarios

**1. Gradual Degradation:**
```bash
# Monitor custom endpoint with increasing delays
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/custom?delay_ms=300",
    "friendly_name": "Custom Test",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'

# After 10 checks, manually test with higher delay:
curl "http://localhost:8001/custom?delay_ms=1500"
```

**2. Intermittent Issues:**
```bash
# Monitor random endpoint
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/random",
    "friendly_name": "Random Test",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

**3. Simulated Real-World Issue:**
```bash
# Monitor simulate-issue endpoint
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/simulate-issue",
    "friendly_name": "Simulated Issue",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }'
```

---

## Success Criteria

✅ **Test Passes If:**
- Slow endpoint shows `is_anomaly: true` after 10+ checks
- Normal endpoint shows `is_anomaly: false` consistently
- Logs show anomaly warnings for slow checks
- Database has correct `is_anomaly` values

❌ **Test Fails If:**
- All checks show `is_anomaly: false` (detection not working)
- All checks show `is_anomaly: true` (baseline issue)
- No logs showing anomaly detection
- Database column missing or always false

---

## Cleanup

After testing:

```bash
# Delete test monitors
curl -X DELETE http://localhost:8000/api/monitors/{MONITOR_ID} \
  -H "Authorization: Bearer $TOKEN"

# Stop test server
# Find the terminal running test_anomaly_server.py and press Ctrl+C
```

---

## Summary

🎯 **You're ready to test!**

1. Test server is running on port 8001 ✓
2. Run `./quick_anomaly_test.sh` for automated test
3. Wait 5-6 minutes for baseline
4. Check results for `is_anomaly: true` on slow endpoint
5. Verify in logs and database

The anomaly detection feature is fully implemented and ready to catch performance issues!
