# Heartbeat Monitor Chart Fix

## Problem
Heartbeat monitors weren't displaying the chart and stats properly on the detail page. The issue was that the HeartbeatChart component was designed for latency visualization, but heartbeat monitors don't track latency - they track ping success/failure.

## Root Cause
1. **Latency is always 0**: For heartbeat monitors, `latency_ms=0` for both successful pings (status_code=200) and missed pings (status_code=0)
2. **Chart showed flat line**: The area chart was trying to visualize 0ms latency, resulting in a flat line at the bottom that looked like no data
3. **Wrong metrics**: Stats were showing latency-based metrics (AVG_LATENCY, P95, P99) which don't apply to heartbeat monitors

## Solution
Modified `HeartbeatChart.tsx` to handle two monitor types differently:

### For Heartbeat Monitors:
- **Chart Type**: Ping status timeline (RECEIVED vs MISSED)
- **Y-axis**: Binary status (0 = MISSED, 1 = RECEIVED)
- **Stats**: PINGS_RECEIVED, MISSED, SUCCESS_RATE
- **Visualization**: Green area for received pings, red area for missed pings
- **Tooltip**: Shows "PING_RECEIVED" or "MISSED" status

### For Regular Monitors (Simple/Scenario):
- **Chart Type**: Latency timeline (unchanged)
- **Y-axis**: Latency in milliseconds
- **Stats**: SUCCESS, ERRORS, ANOMALIES, AVG_LATENCY
- **Visualization**: Green area for successful requests, red area for errors
- **Tooltip**: Shows latency and status code

## Changes Made

### 1. HeartbeatChart Component (`frontend/components/dashboard/HeartbeatChart.tsx`)
- Added `monitorType` prop to distinguish between heartbeat and regular monitors
- Modified data transformation to create binary status values (0/1) for heartbeat monitors
- Updated chart configuration:
  - Y-axis domain set to [0, 1] for heartbeat monitors
  - Y-axis label changes from "LATENCY (MS)" to "STATUS"
  - Custom tick formatter for heartbeat monitors
- Created separate stats sections for each monitor type
- Updated tooltips to show appropriate information
- Modified "Recent Issues" section to show "RECENT_MISSED_PINGS" for heartbeat monitors

### 2. Monitor Detail Page (`frontend/app/dashboard/monitors/[id]/page.tsx`)
- Passed `monitorType` prop to HeartbeatChart component
- Stats section already correctly shows heartbeat-specific metrics (UPTIME, TOTAL_PINGS, EXPECTED_EVERY, LAST_PING)

## Data Flow

### Successful Ping:
1. External service calls `GET /api/heartbeats/{monitor_id}`
2. Backend creates heartbeat record: `status_code=200, latency_ms=0`
3. Frontend displays as green "RECEIVED" in chart

### Missed Ping:
1. Heartbeat watcher detects silence: `(now - last_ping) > (interval + grace_period)`
2. Backend creates heartbeat record: `status_code=0, latency_ms=0, error_message="Heartbeat not received..."`
3. Frontend displays as red "MISSED" in chart

## Testing
To verify the fix works:

1. Create a heartbeat monitor
2. Send a few pings: `curl http://localhost:8000/api/heartbeats/{monitor_id}`
3. Wait for grace period to expire (5 minutes after expected interval)
4. Check detail page - should see:
   - Green bars for received pings
   - Red bars for missed pings
   - Stats showing PINGS_RECEIVED and MISSED counts
   - Incident log showing missed pings with downtime duration

## Visual Differences

### Before:
- Flat line at 0ms (looked like no data)
- Latency-based stats (not applicable)
- Confusing for users

### After:
- Clear binary visualization (received vs missed)
- Heartbeat-specific stats (pings received, missed, success rate)
- Intuitive "Silence is the Alarm" visualization
