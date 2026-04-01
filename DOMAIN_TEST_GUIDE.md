# Domain Expiration Testing Guide

## Quick Test

Run the automated test script:

```bash
cd backend
uv run python test_domain_expiration.py
```

This tests:
- ✅ 24-hour interval logic
- ✅ Status level calculations (EXPIRED, CRITICAL, WARNING, VALID)
- ✅ Real WHOIS lookups for google.com, github.com, python.org

## Live API Test

### 1. Start the backend server

```bash
cd backend
uv run uvicorn app.main:app --reload
```

### 2. Create a monitor

```bash
curl -X POST http://localhost:8000/monitors/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "friendly_name": "Google Domain Test",
    "interval_seconds": 60
  }'
```

### 3. Wait 60 seconds for first check

The worker will:
- Perform HTTP check
- Check SSL certificate
- **Check domain expiration (first time)**

### 4. Get monitor details

```bash
curl http://localhost:8000/monitors/{monitor_id}
```

Expected response includes:
```json
{
  "id": "...",
  "url": "https://google.com",
  "friendly_name": "Google Domain Test",
  "ssl_status": "VALID",
  "ssl_days_remaining": 45,
  "domain_expiry_date": "2028-09-14T04:00:00Z",
  "domain_days_remaining": 896,
  "domain_last_checked": "2026-04-01T07:30:00Z"
}
```

### 5. Verify 24-hour interval

Check logs - subsequent checks should show:
```
[WHOIS] Skipping domain check for https://google.com (checked within last 24 hours)
```

## What to Look For

### Success Indicators
- ✅ `domain_expiry_date` is populated with future date
- ✅ `domain_days_remaining` is positive number
- ✅ `domain_last_checked` is recent timestamp
- ✅ Logs show "WHOIS lookup successful"
- ✅ Subsequent checks skip WHOIS (within 24h)

### Status Levels
- `VALID` - 31+ days remaining (green)
- `WARNING` - 8-30 days remaining (orange)
- `CRITICAL` - 0-7 days remaining (red)
- `EXPIRED` - Negative days (red alert)

## Logs to Monitor

```bash
# Watch backend logs
cd backend
uv run uvicorn app.main:app --reload
```

Look for:
```
[WHOIS] Starting domain expiration check for https://google.com (24h interval)
[WHOIS] Querying WHOIS for domain: google.com
[WHOIS] ✓ Domain check successful for https://google.com: VALID, 896 days remaining
[DB_UPDATE] Adding domain data to update: {...}
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'whois'"

**Solution**: Install python-whois
```bash
cd backend
uv add python-whois
```

### "WHOIS lookup failed"

**Possible causes**:
- Rate limiting (too many queries)
- Invalid domain
- WHOIS server down
- Network issues

**Solution**: Wait 24 hours and try again

### "No expiration date found"

**Cause**: Some TLDs don't expose expiry in WHOIS

**Solution**: This is expected for certain domains - not an error

## Performance Notes

- WHOIS queries take 5-10 seconds
- Runs in background thread (doesn't block HTTP checks)
- Only runs once per 24 hours per domain
- No impact on regular monitoring performance

## Summary

Domain expiration checking is now live! The system will:
1. Check domain expiry on first monitor check
2. Update every 24 hours automatically
3. Provide status levels (VALID, WARNING, CRITICAL, EXPIRED)
4. Respect WHOIS rate limits
5. Display domain info in API responses

Test it out and watch your domains stay safe! 🛡️
