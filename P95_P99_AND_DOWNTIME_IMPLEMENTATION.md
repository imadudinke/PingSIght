# P95/P99 Response Times and Downtime Duration Implementation

## Overview
Added advanced performance metrics (p95/p99 latency) and enhanced incident history with calculated downtime duration to provide deeper insights into monitor performance and reliability.

## Features Implemented

### 1. P95/P99 Response Time Metrics

**What are P95/P99?**
- **P95 (95th percentile)**: 95% of requests were faster than this value
- **P99 (99th percentile)**: 99% of requests were faster than this value
- These metrics help identify outliers and worst-case performance

**Implementation**:
- Added `calculateP95Latency()` utility function
- Added `calculateP99Latency()` utility function
- Both functions:
  - Extract latency values from heartbeats
  - Sort them in ascending order
  - Calculate the percentile index
  - Return the latency at that percentile

**Display**:
- Added to stats grid on monitor detail page
- Expanded grid from 3 columns to 5 columns:
  1. UPTIME (percentage)
  2. AVG_LATENCY (mean)
  3. P95_LATENCY (95th percentile) ⭐ NEW
  4. P99_LATENCY (99th percentile) ⭐ NEW
  5. TOTAL_CHECKS (count)

**Why This Matters**:
- Average latency can hide problems (one slow request among many fast ones)
- P95/P99 show the "worst normal case" performance
- Critical for SLA monitoring (e.g., "99% of requests under 200ms")

### 2. Downtime Duration in Incident Log

**What Changed**:
- Renamed "DURATION" column to "DOWNTIME"
- Now calculates actual downtime duration between failure and recovery
- Shows human-readable format (e.g., "2h 15m", "45m", "30s")

**How It Works**:
1. For each incident (failed heartbeat), find its position in the heartbeat array
2. Look forward through subsequent heartbeats to find the next successful check (status < 400)
3. Calculate time difference between failure and recovery
4. Format as human-readable duration

**Duration Formats**:
- Hours + Minutes: "2h 15m"
- Minutes only: "45m"
- Seconds only: "30s"
- Unknown/Quick recovery: "< 1min"

**Edge Cases Handled**:
- If no recovery found (still down or last check): Shows "< 1min"
- If incident not in array: Shows "< 1min"
- Handles missing timestamps gracefully

### 3. Enhanced Incident Log

**Improvements**:
- Increased from 10 to 20 incidents shown
- Better downtime calculation logic
- Clearer column naming (DOWNTIME vs DURATION)
- Shows actual service interruption time, not just request latency

**Table Columns**:
1. **TIMESTAMP**: When the incident occurred
2. **STATUS**: Always "DOWN" for incidents
3. **ERROR_CODE**: HTTP status code or "TIMEOUT"
4. **DOWNTIME**: How long the service was unavailable ⭐ ENHANCED
5. **MESSAGE**: Error description

## Technical Implementation

### Utility Functions Added

```typescript
// In frontend/lib/utils/monitor.ts

/**
 * Calculate p95 latency from heartbeats
 */
export function calculateP95Latency(heartbeats: any[]): number {
  if (!heartbeats || heartbeats.length === 0) return 0;
  
  const latencies = heartbeats
    .map(hb => hb.latency_ms)
    .filter(l => l != null && l > 0)
    .sort((a, b) => a - b);
  
  if (latencies.length === 0) return 0;
  
  const index = Math.ceil(latencies.length * 0.95) - 1;
  return Math.round(latencies[index] || 0);
}

/**
 * Calculate p99 latency from heartbeats
 */
export function calculateP99Latency(heartbeats: any[]): number {
  // Similar implementation for 99th percentile
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
```

### Component Changes

**Monitor Detail Page** (`frontend/app/dashboard/monitors/[id]/page.tsx`):

1. **Stats Grid Enhancement**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  <MetricCard label="UPTIME" value="99.98%" tone="sand" />
  <MetricCard label="AVG_LATENCY" value="124ms" tone="white" />
  <MetricCard label="P95_LATENCY" value="245ms" tone="white" /> {/* NEW */}
  <MetricCard label="P99_LATENCY" value="387ms" tone="white" /> {/* NEW */}
  <MetricCard label="TOTAL_CHECKS" value="1,234" tone="white" />
</div>
```

2. **Incident Computation**:
```tsx
// Compute incidents from heartbeats (failures only)
const incidents = (monitor.recent_heartbeats || [])
  .filter((hb: any) => hb.status_code >= 400 || hb.error_message)
  .slice(0, 20); // Show last 20 incidents
```

3. **Downtime Calculation**:
```tsx
// In the DOWNTIME column
{(() => {
  // Find next successful heartbeat after this incident
  const allHeartbeats = monitor.recent_heartbeats || [];
  const currentIndex = allHeartbeats.findIndex((hb: any) => hb.id === incident.id);
  
  // Look for next successful check (status < 400)
  const nextSuccess = allHeartbeats
    .slice(currentIndex + 1)
    .find((hb: any) => hb.status_code < 400);
  
  if (nextSuccess) {
    const durationMs = new Date(nextSuccess.created_at).getTime() 
                     - new Date(incident.created_at).getTime();
    // Format duration...
  }
  
  return "< 1min";
})()}
```

## Files Modified

1. **frontend/lib/utils/monitor.ts**
   - Added `calculateP95Latency()`
   - Added `calculateP99Latency()`
   - Added `calculateDowntimeDuration()` (helper)
   - Added `formatDuration()` (helper)

2. **frontend/app/dashboard/monitors/[id]/page.tsx**
   - Imported new utility functions
   - Expanded stats grid from 3 to 5 columns
   - Added P95/P99 metric cards
   - Added incidents computation with IIFE
   - Enhanced DOWNTIME column with duration calculation
   - Renamed "DURATION" to "DOWNTIME" for clarity

## User Experience

### Before
- Only average latency shown (can be misleading)
- Incident log showed request latency, not downtime
- No visibility into performance outliers
- Hard to understand actual service interruption duration

### After
- P95/P99 show worst-case performance
- Downtime column shows actual service unavailability
- Better understanding of performance distribution
- Clear visibility into incident impact

## Use Cases

### 1. SLA Monitoring
"We guarantee 99% of requests complete under 200ms"
- Check P99 latency to verify SLA compliance
- If P99 > 200ms, you're violating your SLA

### 2. Performance Regression Detection
- Average latency: 100ms → 105ms (5% increase, might be noise)
- P99 latency: 200ms → 400ms (100% increase, clear regression!)

### 3. Incident Impact Assessment
- Incident at 2:00 PM, downtime shows "2h 15m"
- Clear understanding of customer impact
- Better incident reports and postmortems

### 4. Capacity Planning
- P95/P99 trending upward over time
- Indicates need for scaling before average is affected
- Proactive rather than reactive

## Data Requirements

**Current Implementation**:
- Uses `recent_heartbeats` array from monitor detail API
- Calculates percentiles from available data
- Works with current 50-heartbeat limit

**Limitations**:
- P95/P99 calculated from last 50 heartbeats only
- For true long-term percentiles, need more historical data
- Downtime calculation limited to visible heartbeat window

**Future Enhancements**:
1. Backend could pre-calculate P95/P99 over longer periods
2. Store incident records with explicit downtime duration
3. Add time-range selector for percentile calculations
4. Aggregate metrics for week/month views

## Performance Considerations

**Calculation Overhead**:
- P95/P99 calculated on every render
- Sorting 50 items is negligible (~O(n log n))
- Could be memoized if performance becomes an issue

**Downtime Calculation**:
- Inline calculation in table render
- Searches through heartbeat array for each incident
- Acceptable for 20 incidents × 50 heartbeats = 1000 operations max

**Optimization Opportunities**:
- Memoize P95/P99 calculations with `useMemo`
- Pre-compute downtime durations in incidents array
- Cache sorted latency arrays

## Testing Checklist

- [x] P95/P99 calculations work with various data sizes
- [x] Handle empty heartbeat arrays gracefully
- [x] Handle null/undefined latency values
- [x] Downtime calculation finds correct recovery point
- [x] Duration formatting handles all time ranges
- [x] Edge cases (no recovery, last incident) handled
- [x] TypeScript compilation passes
- [x] No diagnostic errors
- [x] Stats grid displays 5 columns correctly
- [x] Incident table shows downtime instead of latency

## Competitive Advantage

**vs UptimeRobot**:
- ✅ P95/P99 percentile metrics (they only show average)
- ✅ Calculated downtime duration (they show incident count)
- ✅ Performance distribution visibility
- ✅ Better SLA compliance monitoring

**vs Pingdom**:
- ✅ Real-time percentile calculations
- ✅ Inline downtime duration (no need to click through)
- ✅ Combined with Deep Trace waterfall for complete picture

## Next Steps (Future Enhancements)

1. **Backend Aggregation**:
   - Store P95/P99 in database for historical tracking
   - Pre-calculate over 24h/7d/30d periods
   - Add to monitor stats API response

2. **Incident Tracking**:
   - Create dedicated incidents table
   - Store explicit start_time and end_time
   - Calculate MTTR (Mean Time To Recovery)
   - Track incident frequency

3. **Advanced Metrics**:
   - P50 (median) latency
   - Standard deviation
   - Apdex score
   - Error rate percentage

4. **Alerting**:
   - Alert when P99 exceeds threshold
   - Alert on downtime duration > X minutes
   - SLA violation notifications

5. **Visualization**:
   - Latency distribution histogram
   - Percentile trend charts over time
   - Downtime timeline visualization

## Conclusion

Successfully added P95/P99 response time metrics and enhanced incident history with downtime duration calculations. These features provide deeper insights into monitor performance and reliability, enabling better SLA monitoring, performance regression detection, and incident impact assessment.

The implementation uses client-side calculations on existing data, requiring no backend changes while providing immediate value to users.
