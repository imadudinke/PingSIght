# Step Results Fix - API Response Issue

## Problem
The `step_results` field was showing as `null` in API responses despite being correctly populated in the database.

## Root Cause
The `heartbeats_to_response()` method in `backend/app/services/monitor_service.py` was not including the `step_results` field when converting Heartbeat database models to HeartbeatResponse schemas.

## Solution
Added `step_results=getattr(hb, 'step_results', None)` to the HeartbeatResponse constructor in the `heartbeats_to_response()` method.

### Changed File
- `backend/app/services/monitor_service.py` (line ~145)

### Before
```python
HeartbeatResponse(
    id=hb.id,
    status_code=hb.status_code,
    latency_ms=hb.latency_ms,
    tcp_connect_ms=getattr(hb, 'tcp_connect_ms', None),
    tls_handshake_ms=getattr(hb, 'tls_handshake_ms', None),
    ttfb_ms=getattr(hb, 'ttfb_ms', None),
    timing_details=getattr(hb, 'timing_details', None),
    error_message=hb.error_message,
    created_at=...
)
```

### After
```python
HeartbeatResponse(
    id=hb.id,
    status_code=hb.status_code,
    latency_ms=hb.latency_ms,
    tcp_connect_ms=getattr(hb, 'tcp_connect_ms', None),
    tls_handshake_ms=getattr(hb, 'tls_handshake_ms', None),
    ttfb_ms=getattr(hb, 'ttfb_ms', None),
    timing_details=getattr(hb, 'timing_details', None),
    step_results=getattr(hb, 'step_results', None),  # ← ADDED THIS LINE
    error_message=hb.error_message,
    created_at=...
)
```

## Verification
The database already contains the step_results data with detailed timing for each step:
```json
[
  {
    "name": "Login",
    "url": "https://www.x.com/login",
    "order": 1,
    "status": "UP",
    "status_code": 200,
    "latency_ms": 2047.91,
    "dns_ms": 0.0,
    "tcp_ms": 19.73,
    "tls_ms": 35.0,
    "ttfb_ms": 1.43,
    "error": null,
    "checked_at": "2026-03-31T21:33:39.248195Z"
  },
  {
    "name": "About",
    "url": "https://www.x.com/About",
    "order": 2,
    "status": "UP",
    "status_code": 200,
    "latency_ms": 1536.49,
    "dns_ms": 0.0,
    "tcp_ms": 20.11,
    "tls_ms": 23.12,
    "ttfb_ms": 0.81,
    "error": null,
    "checked_at": "2026-03-31T21:33:41.296106Z"
  }
]
```

## Next Steps
After restarting the backend server, the API will now return step_results with detailed timing breakdown for each scenario step, showing:
- Which step was executed
- Individual timing metrics (DNS, TCP, TLS, TTFB)
- Status and error information per step
- Total latency per step

This allows users to identify exactly which step in a scenario is slow or failing.
