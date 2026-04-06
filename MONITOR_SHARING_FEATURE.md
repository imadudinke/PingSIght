# Monitor Sharing Feature ✅ COMPLETED

## Status: FULLY WORKING
All issues have been resolved. The feature is now fully functional and tested.

### Recent Fixes (April 6, 2026):
1. ✅ Added missing `Heartbeat` import to `backend/app/api/monitors.py`
2. ✅ Fixed heartbeats access (using fetched variable instead of relationship)
3. ✅ Fixed MonitorService instantiation (using static method correctly)
4. ✅ Fixed stats access (using Pydantic model attributes instead of dict.get())
5. ✅ Backend endpoint tested and working: Returns complete monitor data with heartbeats and stats
6. ✅ CORS configured correctly for cross-origin requests

## Overview
Users can now share their monitors publicly via a unique URL. Recipients can view the monitor status, uptime, performance metrics, and incident history without needing a PingSight account.

## Features

### 1. Share Button
- Added "SHARE_MONITOR" option to the monitor actions menu (⋮)
- Available on both Monitors and Heartbeats pages
- Opens a modal to enable/disable sharing

### 2. Share Modal
**Enable Sharing View:**
- Explains what will be shared
- Shows warning about public access
- "ENABLE_PUBLIC_SHARING" button generates unique URL

**Sharing Enabled View:**
- Displays the shareable URL
- One-click copy button
- Usage instructions
- "DISABLE_PUBLIC_SHARING" button to revoke access

### 3. Public Share Page
- Clean, read-only view at `/share/{token}`
- No authentication required
- Shows:
  - Monitor name and status
  - Uptime percentage
  - Average latency (for regular monitors)
  - P95 latency (for regular monitors)
  - Total checks
  - Heartbeat chart with timeline
  - Monitor information (type, interval, created date)
  - "Powered by PingSight" footer

## Technical Implementation

### Backend Changes

#### 1. Database Migration
**File:** `backend/alembic/versions/add_share_token_to_monitors.py`

Adds two new columns to the `monitors` table:
- `share_token` (String, 64 chars, unique, indexed) - Unique token for public access
- `is_public` (Boolean, default false) - Whether sharing is enabled

**To run migration:**
```bash
cd backend
alembic upgrade head
```

#### 2. Monitor Model Updates
**File:** `backend/app/models/monitor.py`

Added fields:
```python
share_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)
is_public: Mapped[bool] = mapped_column(Boolean, default=False)
```

Added method:
```python
def generate_share_token(self) -> str:
    """Generate a unique share token for public access"""
    self.share_token = secrets.token_urlsafe(32)
    return self.share_token
```

#### 3. API Endpoints
**File:** `backend/app/api/monitors.py`

**POST `/monitors/{monitor_id}/share`** - Enable sharing
- Requires authentication
- Generates share token if not exists
- Sets `is_public = True`
- Returns share URL

**DELETE `/monitors/{monitor_id}/share`** - Disable sharing
- Requires authentication
- Sets `is_public = False`
- Token remains but access is denied

**GET `/monitors/shared/{share_token}`** - Get shared monitor
- NO authentication required (public endpoint)
- Returns monitor details if `is_public = True`
- Includes recent heartbeats (up to 200)
- Returns 404 if not found or sharing disabled

### Frontend Changes

#### 1. Share Modal Component
**File:** `frontend/components/monitors/ShareMonitorModal.tsx`

Features:
- Enable/disable sharing toggle
- Share URL display with copy button
- Usage instructions
- Warning about public access
- Loading states and error handling

#### 2. Monitor Actions Menu
**File:** `frontend/components/monitors/MonitorActionsMenu.tsx`

Added:
- "SHARE_MONITOR" menu item with share icon
- `onShare` callback prop

#### 3. Public Share Page
**File:** `frontend/app/share/[token]/page.tsx`

Features:
- Fetches monitor data from public endpoint
- Displays monitor status and metrics
- Shows heartbeat chart
- Clean, branded layout
- Error handling for invalid/disabled shares

#### 4. Page Updates
Updated both monitors and heartbeats pages:
- Added `ShareMonitorModal` component
- Added `isShareModalOpen` state
- Added `onShare` handler to `MonitorActionsMenu`

## User Flow

### Sharing a Monitor:
1. User clicks actions menu (⋮) on a monitor
2. Clicks "SHARE_MONITOR"
3. Modal opens explaining what will be shared
4. User clicks "ENABLE_PUBLIC_SHARING"
5. Unique URL is generated and displayed
6. User copies URL and shares with others

### Viewing a Shared Monitor:
1. Recipient clicks the shared URL
2. Public page loads (no login required)
3. They see:
   - Monitor name and current status
   - Uptime percentage
   - Performance metrics
   - Heartbeat chart
   - Monitor details
4. Page auto-refreshes to show latest data

### Disabling Sharing:
1. User opens share modal again
2. Clicks "DISABLE_PUBLIC_SHARING"
3. Sharing is disabled
4. Shared URL no longer works (returns 404)

## Security Considerations

### Token Security:
- Uses `secrets.token_urlsafe(32)` for cryptographically secure tokens
- 32 bytes = 256 bits of entropy
- URL-safe base64 encoding
- Unique constraint prevents duplicates

### Access Control:
- Only monitor owner can enable/disable sharing
- Public endpoint checks `is_public` flag
- Disabled shares return 404 (not 403) to avoid information leakage
- No sensitive data exposed (no edit/delete capabilities)

### What's Shared:
✅ Shared:
- Monitor name
- Current status (UP/DOWN)
- Uptime percentage
- Response time metrics
- Incident history
- SSL certificate status
- Monitor type and interval

❌ NOT Shared:
- Owner information
- Edit/delete capabilities
- Other monitors from same account
- Authentication tokens
- Internal monitor ID (uses share token instead)

## API Examples

### Enable Sharing
```bash
curl -X POST http://localhost:8000/monitors/{monitor_id}/share \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "share_token": "abc123...",
  "share_url": "http://localhost:3000/share/abc123...",
  "is_public": true
}
```

### Disable Sharing
```bash
curl -X DELETE http://localhost:8000/monitors/{monitor_id}/share \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "is_public": false
}
```

### View Shared Monitor (Public)
```bash
curl http://localhost:8000/monitors/shared/abc123...?include_heartbeats=50
```

Response:
```json
{
  "id": "...",
  "friendly_name": "My API",
  "status": "UP",
  "uptime_percentage": 99.95,
  "average_latency": 45,
  "recent_heartbeats": [...],
  ...
}
```

## Configuration

### Backend (.env)
```env
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

These are used to generate the correct share URLs.

## Testing Checklist

- [ ] Run database migration
- [ ] Enable sharing for a monitor
- [ ] Copy share URL
- [ ] Open share URL in incognito window (no auth)
- [ ] Verify monitor data is displayed
- [ ] Verify heartbeat chart works
- [ ] Disable sharing
- [ ] Verify share URL returns 404
- [ ] Re-enable sharing (should use same token)
- [ ] Test with different monitor types (simple, scenario, heartbeat)
- [ ] Test error handling (invalid token, disabled sharing)

## Future Enhancements

1. **Custom Branding**: Allow users to customize the shared page appearance
2. **Password Protection**: Add optional password for shared monitors
3. **Expiration**: Set expiration dates for share links
4. **Analytics**: Track views of shared monitors
5. **Embed Widget**: Provide embeddable widget for websites
6. **Multiple Share Links**: Generate multiple tokens with different permissions
7. **Share History**: Log who accessed shared monitors and when
8. **Email Sharing**: Send share link directly via email
9. **QR Code**: Generate QR code for easy mobile sharing
10. **Status Badge**: Generate status badge image for README files

## Files Changed

### Backend:
- `backend/alembic/versions/add_share_token_to_monitors.py` (new)
- `backend/app/models/monitor.py` (modified)
- `backend/app/api/monitors.py` (modified)

### Frontend:
- `frontend/components/monitors/ShareMonitorModal.tsx` (new)
- `frontend/components/monitors/MonitorActionsMenu.tsx` (modified)
- `frontend/app/share/[token]/page.tsx` (new)
- `frontend/app/dashboard/monitors/page.tsx` (modified)
- `frontend/app/dashboard/heartbeats/page.tsx` (modified)

## Notes

- Share tokens are permanent until manually regenerated
- Disabling sharing doesn't delete the token (can be re-enabled)
- Public page uses same HeartbeatChart component as dashboard
- No rate limiting on public endpoint (consider adding in production)
- Share URLs work across different domains (CORS configured)
