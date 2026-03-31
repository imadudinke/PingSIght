# Scenario Monitoring Guide

## Overview
Scenario monitors check multiple URLs in sequence to test user journeys or multi-step workflows. Each step is checked independently with detailed failure reporting.

## Key Features

### 1. Multi-Step Checking
- Up to 3 steps per scenario
- Each step checked sequentially
- Individual timing and status for each step
- Detailed failure information

### 2. Failure Detection
When a scenario fails, you get:
- **Which step failed**: Name and order of the failing step
- **Why it failed**: Detailed error message
- **Status code**: HTTP status code or 0 for connection errors
- **Timing**: How long each step took

### 3. Error Types Detected
- **Timeout**: Request took longer than 10 seconds
- **Connection Error**: Unable to reach server
- **HTTP 4xx**: Client errors (404, 403, etc.)
- **HTTP 5xx**: Server errors (500, 503, etc.)
- **Network Issues**: DNS failures, SSL errors, etc.

## Creating Scenario Monitors

### Recommended Interval
- **Simple monitors**: 30-60 seconds (quick checks)
- **Scenario monitors**: 240-300 seconds (4-5 minutes)

Scenario monitors should run less frequently because:
- They check multiple URLs
- Total time = sum of all step times
- More resource intensive

### Example: Create Scenario Monitor

```bash
POST /monitors/
{
  "url": "https://myapp.com",
  "friendly_name": "User Login Flow",
  "interval_seconds": 300,  # 5 minutes
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://myapp.com",
      "order": 1
    },
    {
      "name": "Login Page",
      "url": "https://myapp.com/login",
      "order": 2
    },
    {
      "name": "Dashboard",
      "url": "https://myapp.com/dashboard",
      "order": 3
    }
  ]
}
```

## Heartbeat Response Format

### Successful Scenario
```json
{
  "id": 1234,
  "status_code": 200,
  "latency_ms": 450.5,
  "timing_details": {
    "steps_checked": 3,
    "steps_successful": 3,
    "failed_step": null,
    "failure_reason": null,
    "summary": "All 3 steps completed successfully"
  },
  "step_results": [
    {
      "name": "Homepage",
      "url": "https://myapp.com",
      "order": 1,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 150.2,
      "error": null,
      "checked_at": "2026-03-31T22:00:00Z"
    },
    {
      "name": "Login Page",
      "url": "https://myapp.com/login",
      "order": 2,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 120.3,
      "error": null,
      "checked_at": "2026-03-31T22:00:00Z"
    },
    {
      "name": "Dashboard",
      "url": "https://myapp.com/dashboard",
      "order": 3,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 180.0,
      "error": null,
      "checked_at": "2026-03-31T22:00:00Z"
    }
  ],
  "error_message": null
}
```

### Failed Scenario
```json
{
  "id": 1235,
  "status_code": 500,
  "latency_ms": 320.8,
  "timing_details": {
    "steps_checked": 3,
    "steps_successful": 2,
    "failed_step": "Dashboard",
    "failure_reason": "Server error (HTTP 500)",
    "summary": "Scenario failed at step Dashboard: Server error (HTTP 500)"
  },
  "step_results": [
    {
      "name": "Homepage",
      "url": "https://myapp.com",
      "order": 1,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 150.2,
      "error": null,
      "checked_at": "2026-03-31T22:00:00Z"
    },
    {
      "name": "Login Page",
      "url": "https://myapp.com/login",
      "order": 2,
      "status": "UP",
      "status_code": 200,
      "latency_ms": 120.3,
      "error": null,
      "checked_at": "2026-03-31T22:00:00Z"
    },
    {
      "name": "Dashboard",
      "url": "https://myapp.com/dashboard",
      "order": 3,
      "status": "DOWN",
      "status_code": 500,
      "latency_ms": 50.3,
      "error": "HTTP 500",
      "checked_at": "2026-03-31T22:00:00Z"
    }
  ],
  "error_message": "Server error (HTTP 500)"
}
```

## UI Display Recommendations

### Monitor List View
```
✓ User Login Flow (Scenario)
  Last check: 2 minutes ago
  Status: All 3 steps passing
  Avg latency: 450ms
```

### Failed Scenario Alert
```
✗ User Login Flow (Scenario)
  Failed at: Dashboard (Step 3/3)
  Reason: Server error (HTTP 500)
  Time: 2 minutes ago
```

### Detailed View
Show a step-by-step breakdown:
```
Step 1: Homepage ✓
  Status: 200 OK
  Time: 150ms
  
Step 2: Login Page ✓
  Status: 200 OK
  Time: 120ms
  
Step 3: Dashboard ✗
  Status: 500 Internal Server Error
  Time: 50ms
  Error: Server error (HTTP 500)
```

## Comparison: Simple vs Scenario

| Feature | Simple Monitor | Scenario Monitor |
|---------|---------------|------------------|
| URLs checked | 1 | 1-3 |
| Timing detail | DNS, TCP, TLS, TTFB | Total per step |
| SSL check | Yes (main URL) | Yes (main URL only) |
| Recommended interval | 30-60s | 240-300s (4-5min) |
| Use case | Uptime monitoring | User journey testing |
| Failure info | HTTP status + error | Step name + reason |

## Best Practices

1. **Set appropriate intervals**
   - Don't check scenarios too frequently
   - 4-5 minutes is recommended
   - Adjust based on your needs

2. **Name steps clearly**
   - Use descriptive names: "Login Page", "Checkout"
   - Avoid generic names: "Step 1", "Test"

3. **Order matters**
   - Steps run in order (1, 2, 3)
   - Simulate actual user flow
   - First failure stops reporting (but all steps still run)

4. **Monitor critical paths**
   - Login → Dashboard
   - Product → Cart → Checkout
   - Registration → Verification → Welcome

5. **Alert on failures**
   - Use `failed_step` to identify problem area
   - Use `failure_reason` for quick diagnosis
   - Check `step_results` for detailed analysis

## Example Use Cases

### E-commerce Checkout Flow
```json
{
  "steps": [
    {"name": "Product Page", "url": "https://shop.com/product/123", "order": 1},
    {"name": "Add to Cart", "url": "https://shop.com/cart", "order": 2},
    {"name": "Checkout", "url": "https://shop.com/checkout", "order": 3}
  ]
}
```

### API Workflow
```json
{
  "steps": [
    {"name": "Health Check", "url": "https://api.com/health", "order": 1},
    {"name": "Auth Endpoint", "url": "https://api.com/auth", "order": 2},
    {"name": "Data Endpoint", "url": "https://api.com/data", "order": 3}
  ]
}
```

### Multi-Page Form
```json
{
  "steps": [
    {"name": "Form Step 1", "url": "https://app.com/form/step1", "order": 1},
    {"name": "Form Step 2", "url": "https://app.com/form/step2", "order": 2},
    {"name": "Confirmation", "url": "https://app.com/form/confirm", "order": 3}
  ]
}
```
