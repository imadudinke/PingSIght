# Scenario-Based Monitors

## Overview
Scenario monitors allow you to check multiple URLs in sequence, useful for testing user journeys or multi-step workflows.

## Monitor Types

### 1. Simple Monitor (default)
Single URL monitoring with timing metrics and SSL checking.

### 2. Scenario Monitor
Multi-step monitoring with up to 3 URLs checked in sequence.

## API Usage

### Create Simple Monitor
```bash
POST /monitors/
{
  "url": "https://example.com",
  "friendly_name": "My Website",
  "interval_seconds": 60,
  "monitor_type": "simple"
}
```

### Create Scenario Monitor
```bash
POST /monitors/
{
  "url": "https://example.com",
  "friendly_name": "User Login Flow",
  "interval_seconds": 300,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "order": 1
    },
    {
      "name": "Login Page",
      "url": "https://example.com/login",
      "order": 2
    },
    {
      "name": "Dashboard",
      "url": "https://example.com/dashboard",
      "order": 3
    }
  ]
}
```

## Validation Rules

### Scenario Monitors
- Must have at least 1 step
- Maximum 3 steps allowed
- Step orders must be unique
- Step orders must be sequential (1, 2, 3)
- Each step must have a name and valid URL
- Step names: 1-100 characters

### Simple Monitors
- Cannot have steps
- Only requires a single URL

## Response Format

### Simple Monitor Response
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "friendly_name": "My Website",
  "monitor_type": "simple",
  "steps": null,
  "ssl_status": "valid",
  "ssl_days_remaining": 89,
  ...
}
```

### Scenario Monitor Response
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "friendly_name": "User Login Flow",
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "order": 1
    },
    {
      "name": "Login Page",
      "url": "https://example.com/login",
      "order": 2
    },
    {
      "name": "Dashboard",
      "url": "https://example.com/dashboard",
      "order": 3
    }
  ],
  "ssl_status": "valid",
  "ssl_days_remaining": 89,
  ...
}
```

## Use Cases

### Simple Monitors
- Basic uptime monitoring
- API endpoint health checks
- Single page availability

### Scenario Monitors
- User authentication flows (login → dashboard)
- E-commerce checkout (product → cart → checkout)
- Multi-page forms (step 1 → step 2 → confirmation)
- API workflows (auth → fetch data → process)

## Database Schema

```sql
-- New columns added to monitors table
ALTER TABLE monitors ADD COLUMN monitor_type VARCHAR(20) DEFAULT 'simple';
ALTER TABLE monitors ADD COLUMN steps JSONB DEFAULT '[]';
```

## Future Enhancements

Potential additions for scenario monitors:
- Step-specific assertions (status code, response time)
- Data passing between steps (cookies, headers)
- Conditional steps (if step 1 fails, skip step 2)
- Per-step heartbeat tracking
- Visual flow diagram in UI
- Step-level SSL checking

## Example cURL Commands

### Create Simple Monitor
```bash
curl -X POST "http://localhost:8000/monitors/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "friendly_name": "Google",
    "interval_seconds": 60
  }'
```

### Create Scenario Monitor
```bash
curl -X POST "http://localhost:8000/monitors/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://myapp.com",
    "friendly_name": "Login Flow",
    "interval_seconds": 300,
    "monitor_type": "scenario",
    "steps": [
      {"name": "Homepage", "url": "https://myapp.com", "order": 1},
      {"name": "Login", "url": "https://myapp.com/login", "order": 2},
      {"name": "Dashboard", "url": "https://myapp.com/dashboard", "order": 3}
    ]
  }'
```

### List All Monitors (includes both types)
```bash
curl "http://localhost:8000/monitors/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

- The `url` field is still required for scenario monitors (used as the primary URL)
- Scenario steps are stored as JSONB for flexibility
- Both monitor types use the same heartbeat tracking
- SSL checking works for all HTTPS URLs in both types
- Duplicate prevention: simple monitors by URL, scenario monitors by name
