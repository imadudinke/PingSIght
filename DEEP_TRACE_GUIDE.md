# Deep Trace Tooltip - Visual Guide

## What You Should See

### Monitor Row Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● PRODUCTION_API  [SSL: OK]                                                 │
│   https://api.example.com                                                   │
│                                                                              │
│         90_DAY_UPTIME_HISTORY          99.8%                                │
│         ||||||||||||||||||||||||||||||||||||                                │
│                                                                              │
│                                            [LIVE]  237ms  ⋮                 │
│                                                     ↑                        │
│                                              HOVER HERE!                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Where to Find the Latency Number

**Location:** Right side of the monitor row, between the status pill and the three-dot menu

**Look for:**
- A number followed by "ms" (e.g., "237ms", "1037ms", "450ms")
- Displayed in monospace font
- Light gray/white color
- Changes cursor to "help" icon when you hover

### How to See the Deep Trace Tooltip

**Step 1:** Find the latency number on the right side
```
[LIVE]  237ms  ⋮
         ↑
    HOVER HERE
```

**Step 2:** Move your mouse over the number

**Step 3:** A tooltip will appear above it:
```
        ┌─────────────────────┐
        │   DEEP_TRACE        │
        │                     │
        │   DNS:      10ms    │
        │   TCP:      15ms    │
        │   TLS:      25ms    │
        │   ─────────────     │
        │   TTFB:    187ms    │
        └─────────────────────┘
              ▼
        [LIVE]  237ms  ⋮
```

## What Each Metric Means

### DNS (Domain Name System)
- **What:** Time to resolve domain name to IP address
- **Typical:** 5-50ms
- **High values mean:** DNS server is slow or far away
- **Example:** `DNS: 10ms` ✓ Good

### TCP (Transmission Control Protocol)
- **What:** Time to establish TCP connection
- **Typical:** 10-100ms
- **High values mean:** Network latency or routing issues
- **Example:** `TCP: 15ms` ✓ Good

### TLS (Transport Layer Security)
- **What:** Time for SSL/TLS handshake
- **Typical:** 20-200ms
- **High values mean:** Certificate validation slow or weak cipher
- **Example:** `TLS: 25ms` ✓ Good

### TTFB (Time To First Byte)
- **What:** Time for server to send first byte of response
- **Typical:** 50-500ms
- **High values mean:** Server is slow or overloaded
- **Example:** `TTFB: 187ms` ✓ Good
- **Note:** This is highlighted in YELLOW in the tooltip

## Visual Examples

### Example 1: Fast Response
```
Latency: 237ms

Tooltip:
  DEEP_TRACE
  DNS:    10ms  (4%)
  TCP:    15ms  (6%)
  TLS:    25ms  (11%)
  ─────────────
  TTFB:  187ms  (79%)  ← Most of the time
```

### Example 2: Slow DNS
```
Latency: 1037ms

Tooltip:
  DEEP_TRACE
  DNS:   450ms  (43%)  ← Problem here!
  TCP:    40ms  (4%)
  TLS:    50ms  (5%)
  ─────────────
  TTFB:  497ms  (48%)
```

### Example 3: Slow Server
```
Latency: 2500ms

Tooltip:
  DEEP_TRACE
  DNS:    10ms  (0.4%)
  TCP:    20ms  (0.8%)
  TLS:    30ms  (1.2%)
  ─────────────
  TTFB: 2440ms  (97.6%)  ← Server is slow!
```

## Troubleshooting

### "I don't see the latency number"

**Check:**
1. Make sure you have monitors in your dashboard
2. Look on the RIGHT side of each monitor row
3. It's between the status pill ([LIVE]) and the menu (⋮)
4. Scroll right if your screen is narrow

**Should look like:**
```
... [LIVE]  237ms  ⋮
```

### "The tooltip doesn't appear"

**Try:**
1. Hover directly over the number (not the "ms")
2. Wait 0.5 seconds for animation
3. Make sure JavaScript is enabled
4. Try refreshing the page
5. Check browser console for errors

### "The numbers seem wrong"

**Note:**
- Currently using calculated estimates (mock data)
- Real data will come from actual monitor checks
- Numbers update with each check
- Different monitors will have different values

## Technical Details

### Data Flow

```
Monitor Check
    ↓
Heartbeat Created
    ↓
Timing Details Stored
    ↓
Dashboard Fetches Data
    ↓
MonitorRow Displays Latency
    ↓
User Hovers
    ↓
Tooltip Shows Breakdown
```

### Tooltip Behavior

**Show:**
- On mouse enter (hover)
- After 0ms delay
- With fade-in animation (200ms)

**Hide:**
- On mouse leave
- Immediately
- With fade-out animation

**Position:**
- Above the latency number
- Aligned to the right
- 8px gap from number
- Arrow points to number

## Real-World Use Cases

### Use Case 1: Identify Bottleneck
```
Problem: Website is slow
Action: Check deep trace
Finding: TTFB is 3000ms
Solution: Optimize server/database
```

### Use Case 2: DNS Issues
```
Problem: Intermittent slowness
Action: Check deep trace
Finding: DNS varies 10ms to 500ms
Solution: Use faster DNS or CDN
```

### Use Case 3: TLS Problems
```
Problem: HTTPS slower than HTTP
Action: Check deep trace
Finding: TLS is 800ms
Solution: Update certificates or cipher
```

### Use Case 4: Network Latency
```
Problem: All requests slow
Action: Check deep trace
Finding: TCP is 300ms
Solution: Use closer server/CDN
```

## Summary

**What:** Hover over latency number to see timing breakdown

**Where:** Right side of monitor row (between status and menu)

**Why:** Identify performance bottlenecks quickly

**How:** 
1. Find latency number (e.g., "237ms")
2. Hover over it
3. See breakdown in tooltip
4. Identify which part is slow

**Benefits:**
- Quick troubleshooting
- No need to dig through logs
- Visual and intuitive
- Real-time data
- Professional monitoring tool feature
