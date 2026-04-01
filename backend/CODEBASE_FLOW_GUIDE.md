# PingSight Codebase - Complete Flow Guide

## Overview
PingSight is an uptime monitoring application that checks website availability, measures performance metrics, and tracks SSL certificate expiration. It supports two types of monitors: **Simple** (single URL) and **Scenario** (multi-step user journeys).

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                   │
│              backend/app/api/*.py                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│         backend/app/services/monitor_service.py          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Database Layer (SQLAlchemy)            │
│              backend/app/models/*.py                     │
│              backend/app/db/*.py                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Background Workers (APScheduler)          │
│              backend/app/worker/*.py                     │
└─────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow

### 1. APPLICATION STARTUP
**File: `backend/app/main.py`**

```
1. FastAPI app initializes
2. CORS middleware configured
3. Database tables created (if not exist)
4. API routers mounted:
   - /api/auth (authentication)
   - /api/monitors (monitor CRUD)
   - /api/status (health checks)
5. Background scheduler starts
6. Server listens on port 8000
```

**Key Code:**
```python
app = FastAPI(title="PingSight API")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(monitors.router, prefix="/api/monitors")
scheduler.start_scheduler()  # Starts background checks
```

---

### 2. USER CREATES A MONITOR
**Flow: API → Service → Database → Scheduler**

#### Step 2.1: API Receives Request
**File: `backend/app/api/monitors.py`** (POST /api/monitors)

```
1. User sends POST request with monitor data
2. Request validated against MonitorCreate schema
3. User authentication verified (JWT token)
4. SSRF protection checks URL (no localhost/private IPs)
```

**Request Example:**
```json
{
  "url": "https://example.com",
  "friendly_name": "My Website",
  "interval_seconds": 60,
  "monitor_type": "simple"
}
```

**Or for Scenario:**
```json
{
  "url": "https://example.com",
  "friendly_name": "User Journey",
  "interval_seconds": 300,
  "monitor_type": "scenario",
  "steps": [
    {"name": "Login", "url": "https://example.com/login", "order": 1},
    {"name": "Dashboard", "url": "https://example.com/dashboard", "order": 2}
  ]
}
```

#### Step 2.2: Database Record Created
**File: `backend/app/models/monitor.py`**

```
1. Monitor object created with:
   - Unique UUID
   - User ID (owner)
   - URL and friendly name
   - Check interval (30-3600 seconds)
   - Monitor type (simple/scenario)
   - Steps (JSONB, for scenarios)
   - Initial status: "PENDING"
   - SSL fields: null (will be populated on first check)
2. Saved to PostgreSQL
```

#### Step 2.3: Scheduler Picks Up Monitor
**File: `backend/app/worker/scheduler.py`**

```
1. Scheduler runs every 10 seconds
2. Queries all active monitors
3. Checks if monitor is due for check:
   - last_checked is null (new monitor) → CHECK NOW
   - OR (now - last_checked) >= interval_seconds → CHECK NOW
4. Adds monitor to check queue
```

---

### 3. BACKGROUND CHECK EXECUTION

#### Step 3.1: Check Dispatcher
**File: `backend/app/worker/scheduler.py`** → `perform_check()`

```
1. Receives monitor from queue
2. Checks monitor_type:
   - "simple" → Call perform_simple_check()
   - "scenario" → Call perform_scenario_check()
3. Handles errors and retries
```

---

### 3A. SIMPLE MONITOR CHECK FLOW

#### Step 3A.1: Perform Simple Check
**File: `backend/app/worker/engine.py`** → `perform_simple_check()`

```
┌─────────────────────────────────────────────────────────┐
│  1. DEEP HTTP CHECK (with trace hooks)                  │
│     - Measure DNS resolution time                        │
│     - Measure TCP connection time                        │
│     - Measure TLS handshake time                         │
│     - Measure Time to First Byte (TTFB)                  │
│     - Total latency                                      │
│     - HTTP status code                                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  2. SSL CERTIFICATE CHECK (for HTTPS only)               │
│     - Extract certificate from connection                │
│     - Parse expiry date                                  │
│     - Calculate days remaining                           │
│     - Determine status:                                  │
│       * VALID: > 30 days                                 │
│       * WARNING: 15-30 days                              │
│       * CRITICAL: 1-14 days                              │
│       * EXPIRED: <= 0 days                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  3. SAVE TO DATABASE                                     │
│     - Update Monitor table:                              │
│       * last_status (UP/DOWN/ISSUE)                      │
│       * ssl_status, ssl_expiry_date, ssl_days_remaining  │
│     - Create Heartbeat record:                           │
│       * status_code, latency_ms                          │
│       * tcp_connect_ms, tls_handshake_ms, ttfb_ms        │
│       * timing_details (JSON)                            │
│       * error_message (if failed)                        │
└─────────────────────────────────────────────────────────┘
```

**Detailed Trace Hook Flow:**
```python
# Inside perform_deep_check()
async def trace_handler(event_name: str, info: dict):
    now = time.perf_counter()
    
    # DNS Resolution
    if event_name == "connection.connect_tcp.started":
        marks["dns_complete"] = now
        timings.dns_ms = round((now - marks["start"]) * 1000, 2)
    
    # TCP Connection
    elif event_name == "connection.connect_tcp.complete":
        timings.tcp_ms = round((now - marks["dns_complete"]) * 1000, 2)
    
    # TLS Handshake
    elif event_name == "connection.start_tls.complete":
        timings.tls_ms = round((now - marks["tls_start"]) * 1000, 2)
    
    # Time to First Byte
    elif event_name == "http11.receive_response_headers.started":
        timings.ttfb_ms = round((now - marks["req_sent"]) * 1000, 2)
```

---

### 3B. SCENARIO MONITOR CHECK FLOW

#### Step 3B.1: Perform Scenario Check
**File: `backend/app/worker/engine.py`** → `perform_scenario_check()`

```
┌─────────────────────────────────────────────────────────┐
│  1. MAIN URL CHECK (same as simple monitor)              │
│     - Deep HTTP check with trace hooks                   │
│     - SSL certificate check                              │
│     - Save to Monitor table                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  2. SCENARIO STEPS CHECK (every 4-5 minutes)             │
│     For each step in order:                              │
│       a. Create trace handler for this step              │
│       b. Perform HTTP request with timing                │
│       c. Capture:                                        │
│          - DNS time                                      │
│          - TCP connection time                           │
│          - TLS handshake time                            │
│          - TTFB                                          │
│          - Total latency                                 │
│          - Status code                                   │
│          - Error (if any)                                │
│       d. Store in step_results array                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  3. AGGREGATE RESULTS                                    │
│     - Total latency = sum of all step latencies          │
│     - Overall status:                                    │
│       * UP: All steps successful (2xx-3xx)               │
│       * ISSUE: Some steps have 4xx errors                │
│       * DOWN: Any step has 5xx or connection error       │
│     - Identify failed step and reason                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  4. SAVE TO DATABASE                                     │
│     - Update Monitor table (status, SSL info)            │
│     - Create Heartbeat with:                             │
│       * status_code (overall)                            │
│       * latency_ms (total of all steps)                  │
│       * step_results (JSONB array):                      │
│         [                                                │
│           {                                              │
│             "name": "Login",                             │
│             "url": "...",                                │
│             "status": "UP",                              │
│             "status_code": 200,                          │
│             "latency_ms": 1500,                          │
│             "dns_ms": 0,                                 │
│             "tcp_ms": 20,                                │
│             "tls_ms": 35,                                │
│             "ttfb_ms": 1.5,                              │
│             "error": null                                │
│           },                                             │
│           { ... next step ... }                          │
│         ]                                                │
│       * timing_details (summary)                         │
│       * error_message (if failed)                        │
└─────────────────────────────────────────────────────────┘
```

**Step Results Example:**
```json
{
  "status": "UP",
  "status_code": 200,
  "total_latency_ms": 3500,
  "step_results": [
    {
      "name": "Login",
      "url": "https://example.com/login",
      "order": 1,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 2000,
      "dns_ms": 0,
      "tcp_ms": 20,
      "tls_ms": 35,
      "ttfb_ms": 1.5,
      "error": null,
      "checked_at": "2026-03-31T21:33:39Z"
    },
    {
      "name": "Dashboard",
      "url": "https://example.com/dashboard",
      "order": 2,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 1500,
      "dns_ms": 0,
      "tcp_ms": 15,
      "ttfb_ms": 1.2,
      "error": null,
      "checked_at": "2026-03-31T21:33:41Z"
    }
  ],
  "failed_step": null,
  "failure_reason": null
}
```

---

### 4. USER RETRIEVES MONITOR DATA

#### Step 4.1: API Request
**File: `backend/app/api/monitors.py`** (GET /api/monitors/{monitor_id})

```
1. User requests monitor details
2. JWT token validated
3. Monitor ID converted to UUID
```

#### Step 4.2: Service Layer Processing
**File: `backend/app/services/monitor_service.py`**

```
┌─────────────────────────────────────────────────────────┐
│  get_monitor_with_heartbeats()                           │
│  1. Query Monitor by ID and user_id (authorization)      │
│  2. Query recent Heartbeats (last 50, ordered by time)   │
│  3. Calculate statistics:                                │
│     - Uptime percentage (all time)                       │
│     - Average latency (successful checks only)           │
│     - Total checks                                       │
│     - Last 24h uptime                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  heartbeats_to_response()                                │
│  Convert Heartbeat models to HeartbeatResponse schemas   │
│  - Include all timing fields                             │
│  - Include step_results (for scenarios)                  │
│  - Format timestamps with timezone                       │
└─────────────────────────────────────────────────────────┘
```

#### Step 4.3: API Response
**File: `backend/app/api/monitors.py`**

```
Return MonitorDetailResponse:
{
  "id": "uuid",
  "user_id": "uuid",
  "url": "https://example.com",
  "friendly_name": "My Website",
  "interval_seconds": 60,
  "status": "UP",
  "is_active": true,
  "last_checked": "2026-03-31T21:33:39Z",
  "created_at": "2026-03-31T20:00:00Z",
  "monitor_type": "scenario",
  "steps": [...],
  "ssl_status": "VALID",
  "ssl_expiry_date": "2027-03-31T00:00:00Z",
  "ssl_days_remaining": 365,
  "recent_heartbeats": [
    {
      "id": 1,
      "status_code": 200,
      "latency_ms": 3500,
      "tcp_connect_ms": 20,
      "tls_handshake_ms": 35,
      "ttfb_ms": 1.5,
      "timing_details": {...},
      "step_results": [...],  // For scenarios
      "error_message": null,
      "created_at": "2026-03-31T21:33:39Z"
    }
  ],
  "uptime_percentage": 99.5,
  "average_latency": 1200,
  "total_checks": 100
}
```

---

## Database Schema

### monitors Table
```sql
CREATE TABLE monitors (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    url VARCHAR NOT NULL,
    name VARCHAR(50) NOT NULL,
    interval_seconds INTEGER NOT NULL,
    last_status VARCHAR(20) DEFAULT 'PENDING',
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Monitor type
    monitor_type VARCHAR(20) DEFAULT 'simple',
    steps JSONB DEFAULT '[]',
    
    -- SSL Certificate fields
    ssl_status VARCHAR(20),
    ssl_expiry_date TIMESTAMP,
    ssl_days_remaining INTEGER
);
```

### heartbeats Table
```sql
CREATE TABLE heartbeats (
    id BIGSERIAL PRIMARY KEY,
    monitor_id UUID REFERENCES monitors(id),
    status_code INTEGER NOT NULL,
    latency_ms FLOAT NOT NULL,
    
    -- Detailed timing (for simple monitors)
    tcp_connect_ms FLOAT,
    tls_handshake_ms FLOAT,
    ttfb_ms FLOAT,
    timing_details JSON,
    
    -- Scenario step results (for scenario monitors)
    step_results JSONB,
    
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Key Components Explained

### 1. Trace Hooks (Performance Measurement)
**Purpose:** Capture detailed timing at each network layer

```python
# httpx provides events at each stage:
- connection.connect_tcp.started    → DNS resolution complete
- connection.connect_tcp.complete   → TCP connection established
- connection.start_tls.complete     → TLS handshake done
- http11.send_request_headers       → Request sent
- http11.receive_response_headers   → First byte received
```

### 2. SSL Certificate Checking
**File: `backend/app/worker/ssl_checker.py`**

```python
1. Extract hostname from URL
2. Create SSL context
3. Connect to server on port 443
4. Get peer certificate
5. Parse notAfter date
6. Calculate days remaining
7. Determine status based on thresholds
```

### 3. Scheduler Logic
**File: `backend/app/worker/scheduler.py`**

```python
# Runs every 10 seconds
for monitor in active_monitors:
    if should_check(monitor):
        asyncio.create_task(perform_check(monitor))

def should_check(monitor):
    if not monitor.last_checked:
        return True  # New monitor
    
    elapsed = now - monitor.last_checked
    return elapsed >= monitor.interval_seconds
```

---

## Error Handling

### Connection Errors
```
httpx.ConnectError → Status: DOWN, status_code: 0
Error message: "Connection Error: Unable to reach server"
```

### Timeout Errors
```
httpx.TimeoutException → Status: DOWN, status_code: 0
Error message: "Timeout: Request took longer than 10 seconds"
```

### HTTP Errors
```
4xx errors → Status: ISSUE
5xx errors → Status: DOWN
Error message includes status code and reason
```

### Scenario-Specific
```
If any step fails:
- Record which step failed
- Record failure reason
- Continue checking remaining steps (optional)
- Mark overall scenario as DOWN/ISSUE
```

---

## File Structure Summary

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── api/
│   │   ├── auth.py                # Authentication endpoints
│   │   ├── monitors.py            # Monitor CRUD endpoints
│   │   └── status.py              # Health check endpoints
│   ├── core/
│   │   ├── config.py              # Configuration settings
│   │   └── security.py            # JWT, password hashing
│   ├── db/
│   │   ├── base.py                # SQLAlchemy base
│   │   └── session.py             # Database session management
│   ├── models/
│   │   ├── monitor.py             # Monitor database model
│   │   ├── heartbeat.py           # Heartbeat database model
│   │   └── user.py                # User database model
│   ├── schemas/
│   │   └── monitor.py             # Pydantic schemas (validation)
│   ├── services/
│   │   └── monitor_service.py     # Business logic
│   └── worker/
│       ├── scheduler.py           # APScheduler setup
│       ├── engine.py              # Check execution logic
│       └── ssl_checker.py         # SSL certificate checking
├── alembic/                       # Database migrations
└── .env                           # Environment variables
```

---

## Reading Order Recommendation

To understand the codebase, read files in this order:

1. **`backend/app/main.py`** - Application entry point
2. **`backend/app/models/monitor.py`** - Data structure
3. **`backend/app/models/heartbeat.py`** - Data structure
4. **`backend/app/schemas/monitor.py`** - API contracts
5. **`backend/app/api/monitors.py`** - API endpoints
6. **`backend/app/services/monitor_service.py`** - Business logic
7. **`backend/app/worker/scheduler.py`** - Background job scheduling
8. **`backend/app/worker/engine.py`** - Check execution (MOST IMPORTANT)
9. **`backend/app/worker/ssl_checker.py`** - SSL checking
10. **`backend/app/core/config.py`** - Configuration

---

## Common Operations Flow

### Creating a Simple Monitor
```
User → API (POST /monitors) → Validate → DB Insert → Scheduler picks up → 
perform_simple_check() → Deep check + SSL check → Save heartbeat → 
Repeat every interval_seconds
```

### Creating a Scenario Monitor
```
User → API (POST /monitors with steps) → Validate → DB Insert → 
Scheduler picks up → perform_check() → 
  1. Main URL: Deep check + SSL check
  2. Steps: perform_scenario_check() with trace hooks per step
→ Save heartbeat with step_results → Repeat every interval_seconds
```

### Viewing Monitor Status
```
User → API (GET /monitors/{id}) → Service layer → 
Query monitor + heartbeats + calculate stats → 
Format response with step_results → Return JSON
```

---

## Key Differences: Simple vs Scenario

| Feature | Simple Monitor | Scenario Monitor |
|---------|---------------|------------------|
| URLs checked | 1 (main URL) | 1 main + up to 3 steps |
| Check frequency | 30-3600 seconds | Main: same, Steps: 4-5 min |
| SSL check | Yes (main URL) | Yes (main URL only) |
| Trace hooks | Main URL only | Main URL + each step |
| Heartbeat data | Single timing | step_results array |
| Failure reporting | Simple error | Which step failed + why |

---

This guide should help you understand the complete flow from user request to background checks to data retrieval!
