# Monitor Creation Guide

## Overview
The monitor creation functionality allows users to create three types of monitors:
1. **Simple** - Single URL endpoint monitoring
2. **Scenario** - Multi-step monitoring with keyword validation
3. **Heartbeat** - Reverse-ping monitoring (expects inbound pings)

## Features

### Simple Monitor
- Monitors a single URL endpoint
- Configurable check interval (30-3600 seconds)
- Tracks uptime, latency, and SSL certificate status
- Domain expiration monitoring

### Scenario Monitor
- Multi-step monitoring (up to 3 steps)
- Each step can have:
  - Custom name
  - Unique URL
  - Optional keyword validation (case-insensitive)
- Sequential execution with detailed timing metrics
- Validates keyword presence in response body

### Heartbeat Monitor
- Reverse-ping monitoring
- Expects inbound heartbeat pings
- Generates unique heartbeat URL
- Configurable expected interval (minimum 60 seconds)
- Alerts when heartbeat is missed

## API Schema

### Simple Monitor
```json
{
  "url": "https://example.com",
  "friendly_name": "My API",
  "interval_seconds": 60,
  "monitor_type": "simple"
}
```

### Scenario Monitor
```json
{
  "url": "https://example.com",
  "friendly_name": "User Journey",
  "interval_seconds": 60,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "order": 1,
      "required_keyword": "Welcome"
    },
    {
      "name": "Login Page",
      "url": "https://example.com/login",
      "order": 2,
      "required_keyword": "Sign In"
    },
    {
      "name": "Dashboard",
      "url": "https://example.com/dashboard",
      "order": 3,
      "required_keyword": "Dashboard"
    }
  ]
}
```

### Heartbeat Monitor
```json
{
  "friendly_name": "Cron Job Monitor",
  "interval_seconds": 300,
  "monitor_type": "heartbeat"
}
```

## Validation Rules

### URL Validation
- Must be valid HTTP/HTTPS URL
- SSRF protection: blocks internal/private IPs
- Blocks localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x
- Blocks internal domains (internal, local, intranet, corp, lan)

### Interval Validation
- Simple/Scenario: 30-3600 seconds
- Heartbeat: 60-3600 seconds

### Scenario Steps Validation
- Maximum 3 steps
- Each step must have unique order (1, 2, 3)
- Orders must be sequential
- Keyword validation is optional but recommended
- Keyword search is case-insensitive

### Name Validation
- 1-50 characters
- Must be unique per user (for scenario and heartbeat monitors)

## UI Components

### CreateMonitorModal
Location: `frontend/components/monitors/CreateMonitorModal.tsx`

Features:
- Type selection (Simple/Scenario/Heartbeat)
- Dynamic form based on monitor type
- Step management for scenario monitors
- Real-time validation
- Error handling
- Loading states

### Integration
The modal is integrated into the dashboard:
- Button: "+ NEW_MONITOR" in the ACTIVE_MONITORS section
- Opens modal on click
- Refreshes monitor list on successful creation

## Backend Implementation

### Endpoints
- `POST /monitors/` - Create simple or scenario monitor
- `POST /monitors/heartbeat` - Create heartbeat monitor

### Security Features
- SSRF protection
- Duplicate prevention
- User authorization
- Input validation
- SQL injection prevention

### Monitoring Features
- Automatic scheduling
- Immediate initial check
- Domain expiration checking
- SSL certificate monitoring
- Anomaly detection
- Detailed timing metrics

## Usage Example

1. Click "+ NEW_MONITOR" button on dashboard
2. Select monitor type
3. Fill in required fields:
   - Friendly name
   - URL (for simple/scenario)
   - Check interval
   - Steps (for scenario)
4. Click "CREATE_MONITOR"
5. Monitor appears in the list and starts checking immediately

## Error Handling

Common errors:
- **Duplicate monitor**: Monitor with same URL/name already exists
- **Invalid URL**: URL format is incorrect or blocked by SSRF protection
- **Invalid interval**: Interval outside allowed range
- **Invalid steps**: Scenario steps validation failed
- **Network error**: Failed to communicate with backend
- **Authentication error**: User not authenticated

## Future Enhancements

Potential improvements:
- Custom headers for monitors
- Authentication support (Basic, Bearer, API Key)
- POST request monitoring
- Response time thresholds
- Custom alert rules
- Monitor groups/tags
- Bulk operations
- Import/export monitors
