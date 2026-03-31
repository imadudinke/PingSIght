# SSL Certificate Checker

## Overview
Automatic SSL certificate monitoring integrated into the PingSight monitoring system.

## Features
- Automatic SSL certificate expiration checking for HTTPS monitors
- Certificate status tracking (valid, warning, critical, expired)
- Days remaining until expiration
- Issuer and subject information

## How It Works

### 1. SSL Checker Module (`app/worker/ssl_checker.py`)
- Uses native Python `ssl` and `socket` libraries
- Connects directly to HTTPS endpoints
- Extracts certificate information without full HTTP request
- Calculates days remaining until expiration

### 2. Integration with Monitor Checks
When a monitor check runs (`perform_check` in `engine.py`):
1. Performs standard HTTP check (DNS, TCP, TLS, TTFB)
2. If URL is HTTPS, extracts SSL certificate info
3. Updates monitor record with SSL status and expiry data
4. Stores in database for tracking and alerts

### 3. Database Fields (Monitor Model)
- `ssl_status`: Certificate status (valid/warning/critical/expired)
- `ssl_expiry_date`: When certificate expires
- `ssl_days_remaining`: Days until expiration

### 4. Status Levels
- **valid**: More than 30 days remaining
- **warning**: 8-30 days remaining
- **critical**: 1-7 days remaining
- **expired**: Certificate has expired

## API Endpoints

### Test SSL Check
```bash
GET /status/test-ssl?url=https://example.com
```

Response:
```json
{
  "url": "https://example.com",
  "ssl_status": "valid",
  "days_remaining": 89,
  "expiry_date": "2026-06-28T23:59:59+00:00",
  "issuer": [["C", "US"], ["O", "Let's Encrypt"]],
  "subject": [["CN", "example.com"]]
}
```

### Monitor Response (includes SSL data)
```bash
GET /monitors/{id}
```

Response includes:
```json
{
  "id": "...",
  "url": "https://example.com",
  "ssl_status": "valid",
  "ssl_expiry_date": "2026-06-28T23:59:59+00:00",
  "ssl_days_remaining": 89,
  ...
}
```

## Usage Examples

### Test SSL Certificate
```bash
curl "http://localhost:8000/status/test-ssl?url=https://google.com"
```

### Create Monitor (SSL auto-checked)
```bash
curl -X POST "http://localhost:8000/monitors/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "friendly_name": "My Site",
    "interval_seconds": 300
  }'
```

SSL certificate will be checked automatically on each monitor run.

## Frontend Integration Ideas

### 1. SSL Status Badge
Display certificate status with color coding:
- Green: valid (30+ days)
- Yellow: warning (8-30 days)
- Orange: critical (1-7 days)
- Red: expired

### 2. Expiry Countdown
Show "SSL expires in X days" on monitor cards

### 3. Sorting/Filtering
- Sort monitors by SSL expiry date
- Filter to show only certificates expiring soon
- Alert dashboard for critical SSL certificates

### 4. Certificate Details Modal
Click to view full certificate information:
- Issuer
- Subject
- Valid from/to dates
- Certificate chain

## Error Handling

The SSL checker gracefully handles:
- Non-HTTPS URLs (returns None, no SSL check)
- Connection timeouts
- SSL errors (expired, self-signed, etc.)
- Invalid certificates

Errors are logged but don't fail the main monitor check.

## Performance

SSL checking adds minimal overhead:
- Separate from HTTP request
- Uses direct socket connection
- Typically completes in < 1 second
- Only runs for HTTPS URLs

## Migration

Run the migration to add SSL fields:
```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

This adds three new columns to the `monitors` table.
