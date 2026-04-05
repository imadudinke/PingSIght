# Heartbeat URL Display on Detail Page

## Overview
Added a prominent, beautifully designed heartbeat URL section to the monitor detail page, making it easy for users to copy and use the URL in their scripts.

## Visual Design

### Location
- Appears right after the CONFIGURATION section
- Only visible for heartbeat monitors
- Highlighted with yellow/gold accent colors

### Color Scheme
- **Border**: Yellow/gold with transparency (`#f2d48a/30`)
- **Background**: Subtle yellow tint (`#f2d48a/5`)
- **Text**: Yellow highlights for important info
- **Code blocks**: Dark background with yellow text

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ HEARTBEAT_URL [REVERSE_PING]                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────┐  ┌──────────┐ │
│ │ http://localhost:8000/api/...       │  │  COPY    │ │
│ └──────────────────────────────────────┘  └──────────┘ │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ USAGE_EXAMPLE:                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ #!/bin/bash                                        │ │
│ │                                                    │ │
│ │ # Your script logic                               │ │
│ │ python3 backup_database.py                        │ │
│ │                                                    │ │
│ │ # Ping on success                                 │ │
│ │ curl http://localhost:8000/api/...                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ EXPECTED_INTERVAL: 60s    GRACE_PERIOD: 5 minutes      │
│ LAST_PING: Apr 6, 2026    ALERT_ON: SILENCE            │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ • Add curl command at the END of your script            │
│ • Only ping on SUCCESS (silence is the alarm!)          │
│ • Works with GET or POST requests                       │
│ • No authentication required (URL is the secret)        │
└─────────────────────────────────────────────────────────┘
```

## Features

### 1. Prominent Header
```tsx
<div className="flex items-center gap-3">
  <div className="text-[#f2d48a] text-[12px] font-bold">
    HEARTBEAT_URL
  </div>
  <div className="badge">
    REVERSE_PING
  </div>
</div>
```

### 2. URL Display with Copy Button
- **Full URL** displayed in code block
- **Large COPY button** with clipboard icon
- **Yellow highlight** for visibility
- **Break-all** for long URLs

```tsx
<div className="flex items-center gap-3">
  <code className="flex-1 px-4 py-3 bg-[#0f1113] text-[#f2d48a]">
    {monitor.heartbeat_url}
  </code>
  
  <button onClick={copyToClipboard}>
    <ClipboardIcon />
    COPY
  </button>
</div>
```

### 3. Usage Example
- **Bash script** with syntax highlighting
- **Actual URL** embedded in example
- **Comments** explaining each step
- **Dark code block** for readability

```bash
#!/bin/bash

# Your script logic
python3 backup_database.py

# Ping on success
curl http://localhost:8000/api/heartbeats/...
```

### 4. Quick Info Grid
- **Expected Interval**: Shows configured interval
- **Grace Period**: Always 5 minutes
- **Last Ping**: Timestamp of last received ping
- **Alert On**: Highlights "SILENCE" in red

### 5. Tips Section
- **Best practices** in bullet points
- **Key concepts** highlighted in yellow
- **Simple language** for clarity

## Implementation Details

### Conditional Rendering
Only shows for heartbeat monitors:
```tsx
{monitor.monitor_type === "heartbeat" && monitor.heartbeat_url && (
  <div className="heartbeat-url-section">
    {/* Content */}
  </div>
)}
```

### Copy to Clipboard
```tsx
<button
  onClick={() => {
    navigator.clipboard.writeText(monitor.heartbeat_url || "");
  }}
>
  COPY
</button>
```

### URL Hiding in Configuration
For heartbeat monitors, the URL field is hidden in configuration:
```tsx
{monitor.monitor_type !== "heartbeat" && (
  <KeyValue k="URL" v={monitor.url} />
)}
```

## User Benefits

### 1. Immediate Visibility
- Can't miss the URL
- Highlighted section stands out
- Clear labeling

### 2. Easy Copy
- One-click copy
- No manual selection needed
- Works on all browsers

### 3. Clear Instructions
- Usage example with actual URL
- Best practices highlighted
- Common mistakes prevented

### 4. Context Awareness
- Shows last ping timestamp
- Displays expected interval
- Highlights grace period

### 5. Professional Design
- Matches brand colors
- Clean, modern layout
- Consistent with rest of UI

## Responsive Design

### Desktop (>768px)
- Two-column grid for quick info
- Full-width URL display
- Side-by-side URL and copy button

### Mobile (<768px)
- Single column layout
- Stacked URL and copy button
- Scrollable code blocks

## Accessibility

### Keyboard Navigation
- Tab to copy button
- Enter to copy
- Focus states visible

### Screen Readers
- Proper labels for all elements
- Code blocks announced
- Button states clear

### Color Contrast
- Yellow text on dark background (WCAG AA)
- Code blocks readable
- Focus indicators visible

## Code Quality

### Type Safety
```typescript
{monitor.monitor_type === "heartbeat" && monitor.heartbeat_url && (
  // TypeScript knows heartbeat_url is string here
)}
```

### Null Safety
```typescript
navigator.clipboard.writeText(monitor.heartbeat_url || "");
```

### Clean Separation
- Heartbeat section separate from configuration
- Only shows when relevant
- No clutter for non-heartbeat monitors

## Comparison with Competitors

### vs UptimeRobot
✅ **Better visibility** (they hide it in settings)
✅ **Usage example** (they have minimal docs)
✅ **One-click copy** (they require manual selection)
✅ **Visual design** (ours is more prominent)

### vs Healthchecks.io
✅ **Integrated view** (they have separate page)
✅ **Better styling** (more modern design)
✅ **More context** (we show interval, grace period)
✅ **Tips included** (they have external docs)

### vs Pingdom
✅ **Simpler** (they require agent setup)
✅ **More visible** (they bury it in config)
✅ **Better UX** (cleaner, more intuitive)

## Testing Checklist

- [x] Section only shows for heartbeat monitors
- [x] URL displays correctly
- [x] Copy button works
- [x] Usage example shows actual URL
- [x] Last ping timestamp displays
- [x] Expected interval shows correctly
- [x] Grace period displays (5 minutes)
- [x] Tips are readable
- [x] Responsive on mobile
- [x] TypeScript compilation passes

## Future Enhancements

### 1. Copy Feedback
Add toast notification:
```tsx
const [copied, setCopied] = useState(false);

onClick={() => {
  navigator.clipboard.writeText(url);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}}

{copied ? "COPIED!" : "COPY"}
```

### 2. Multiple Formats
```tsx
<button>Copy as curl</button>
<button>Copy as Python</button>
<button>Copy as PowerShell</button>
```

### 3. QR Code
```tsx
<QRCode value={heartbeat_url} />
```

### 4. Test Ping Button
```tsx
<button onClick={sendTestPing}>
  SEND_TEST_PING
</button>
```

### 5. Download Script
```tsx
<button onClick={downloadScript}>
  DOWNLOAD_EXAMPLE_SCRIPT
</button>
```

### 6. Webhook Format
```tsx
<code>
  POST {heartbeat_url}
  Content-Type: application/json
</code>
```

## Example Screenshots

### Heartbeat Monitor Detail Page
```
┌─────────────────────────────────────────────────────────┐
│ ← BACK_TO_DASHBOARD                    ↻ REFRESH        │
├─────────────────────────────────────────────────────────┤
│ MONITOR_DETAILS                                          │
│ Daily Backup Script                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [UPTIME: 99.98%] [AVG: 0ms] [P95: 0ms] [P99: 0ms]      │
│                                                          │
│ ┌─ CONFIGURATION ────────────────────────────────────┐  │
│ │ TYPE: heartbeat    STATUS: UP                      │  │
│ │ INTERVAL: 60s      ACTIVE: YES                     │  │
│ │ CREATED: Apr 5     LAST_CHECK: Apr 6               │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ HEARTBEAT_URL [REVERSE_PING] ─────────────────────┐  │
│ │                                                     │  │
│ │ [http://localhost:8000/api/...] [COPY]            │  │
│ │                                                     │  │
│ │ USAGE_EXAMPLE:                                     │  │
│ │ #!/bin/bash                                        │  │
│ │ python3 backup.py                                  │  │
│ │ curl http://localhost:8000/api/...                │  │
│ │                                                     │  │
│ │ EXPECTED: 60s  GRACE: 5min  ALERT: SILENCE        │  │
│ │                                                     │  │
│ │ • Add at END of script                             │  │
│ │ • Only ping on SUCCESS                             │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Conclusion

Successfully added a prominent, well-designed heartbeat URL section to the monitor detail page:

✅ **Highly visible** with yellow/gold highlighting
✅ **Easy to copy** with one-click button
✅ **Clear instructions** with usage example
✅ **Contextual info** (interval, grace period, last ping)
✅ **Best practices** highlighted in tips
✅ **Professional design** matching brand
✅ **Responsive** on all devices
✅ **Type-safe** implementation

Users can now easily find and copy their heartbeat URL directly from the monitor detail page!
