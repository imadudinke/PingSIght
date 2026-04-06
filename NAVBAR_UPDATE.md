# Navbar Update: Settings → Notifications

## Changes Made

### 1. Sidebar Navigation
**File**: `frontend/components/dashboard/Sidebar.tsx`
- Changed label from "SETTINGS" to "NOTIFICATIONS"
- Kept the same route `/dashboard/settings` (no breaking changes)
- Kept the gear icon (appropriate for notifications/alerts)

### 2. Page Content Updates
**File**: `frontend/app/dashboard/settings/page.tsx`

#### Function Name
- `SettingsPage()` → `NotificationsPage()`

#### Page Titles
- Main header: "SETTINGS" → "NOTIFICATIONS"
- Loading header: "SETTINGS" → "NOTIFICATIONS"

#### Descriptions
- Updated description to "DISCORD_WEBHOOKS_AND_ALERT_PREFERENCES"
- Loading text: "LOADING_SETTINGS..." → "LOADING_NOTIFICATIONS..."

#### Button Text
- Save button: "SAVE_SETTINGS" → "SAVE_NOTIFICATIONS"

## Why This Makes Sense

### 1. More Descriptive
- "NOTIFICATIONS" clearly indicates what the page does
- Users immediately understand this is for alerts and notifications
- Aligns with the actual functionality (Discord webhooks, alerts)

### 2. Better UX
- Reduces confusion about what "Settings" contains
- More specific and actionable naming
- Matches user mental model (they want to set up notifications)

### 3. Consistent with Feature
- The page is specifically for notification configuration
- All functionality is notification-related:
  - Discord webhook setup
  - Alert preferences (down, recovery)
  - Alert thresholds
  - SSL/Domain expiry alerts

### 4. Industry Standard
- Most monitoring tools use "Notifications" or "Alerts" in navigation
- Users expect to find notification settings under this name
- More intuitive than generic "Settings"

## Navigation Flow

```
Dashboard Sidebar:
├── HOME
├── MONITORS  
├── HEARTBEATS
├── STATUS_PAGES (coming soon)
└── NOTIFICATIONS ← Updated from "SETTINGS"
```

## URL Structure (Unchanged)

The URL remains the same to avoid breaking changes:
- Route: `/dashboard/settings`
- File location: `frontend/app/dashboard/settings/page.tsx`

This maintains backward compatibility while improving the user experience.

## User Benefits

1. **Clarity**: Users know exactly what this page does
2. **Discoverability**: Easier to find notification settings
3. **Expectation**: Matches what users expect from monitoring tools
4. **Functionality**: Name accurately reflects the page content

The navigation now clearly communicates that this is where users configure their notification and alert preferences, making the interface more intuitive and user-friendly.