# Production 401 Error - Actual Fix Applied

## Problem Identified

Your production app was getting 401 Unauthorized errors because:

1. **Frontend on Vercel was calling Render directly** instead of using the BFF proxy
2. **BFF proxy wasn't handling backend routing correctly** - The backend has mixed routing where some endpoints need `/api` prefix and some don't

## Root Cause

The backend routing structure is:
- `/monitors/`, `/auth/` → NO `/api` prefix
- `/admin/`, `/status-pages/`, `/notifications/`, `/export/`, `/heartbeats/` → WITH `/api` prefix

When the BFF proxy forwarded requests, it was stripping `/api/v1` but not adding back `/api` for routes that need it.

Example of the bug:
```
Browser → /api/v1/admin/users
BFF extracts → admin/users
BFF forwards → https://pingsight.onrender.com/admin/users ❌
Backend expects → https://pingsight.onrender.com/api/admin/users ✅
```

## What Was Fixed

### 1. BFF Proxy Route Handler
**File:** `frontend/app/api/v1/[[...path]]/route.ts`

Added logic to detect which routes need the `/api` prefix and add it back when forwarding to Render:

```typescript
// The backend has mixed routing:
// - /monitors/, /auth/ → no /api prefix
// - /admin/, /status-pages/, /notifications/, /export/ → /api prefix
// So we need to add /api back for those routes
const needsApiPrefix = pathStr.startsWith("admin/") || 
                       pathStr.startsWith("status-pages/") || 
                       pathStr.startsWith("notifications/") ||
                       pathStr.startsWith("export/") ||
                       pathStr.startsWith("heartbeats/");

const finalPath = needsApiPrefix ? `/api${path}` : path;
const target = `${backend}${finalPath}${request.nextUrl.search}`;
```

### 2. Environment Configuration
**File:** `frontend/.env.local`

Updated to use localhost for development and added comments about production:

```bash
# Local development - connect directly to backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production on Vercel, DO NOT set NEXT_PUBLIC_API_URL
# The BFF proxy will handle routing to Render via BACKEND_INTERNAL_URL
```

## Required Vercel Configuration

You still need to set this on Vercel:

```bash
BACKEND_INTERNAL_URL=https://pingsight.onrender.com
```

Do NOT set:
- `NEXT_PUBLIC_API_URL` (let it use BFF)
- `NEXT_PUBLIC_BFF=0` (keep BFF enabled)

## Required Render Configuration

Ensure these are set on Render:

```bash
FRONTEND_URL=https://pingsight.vercel.app
BACKEND_URL=https://pingsight.onrender.com
CORS_ORIGINS=https://pingsight.vercel.app
AUTH_COOKIE_SAMESITE=lax
ENVIRONMENT=production
```

## How It Works Now

### Correct Flow (After Fix)

```
Browser calls: /api/v1/admin/users
    ↓
BFF receives: admin/users
    ↓
BFF detects: needs /api prefix
    ↓
BFF forwards: https://pingsight.onrender.com/api/admin/users ✅
    ↓
Backend processes: /api/admin/users ✅
```

### For Monitor Routes (No /api prefix needed)

```
Browser calls: /api/v1/monitors/
    ↓
BFF receives: monitors/
    ↓
BFF detects: no /api prefix needed
    ↓
BFF forwards: https://pingsight.onrender.com/monitors/ ✅
    ↓
Backend processes: /monitors/ ✅
```

## Testing After Deployment

1. **Set `BACKEND_INTERNAL_URL` on Vercel**
2. **Redeploy your Vercel app**
3. **Open DevTools → Network tab**
4. **Login and navigate to admin panel**
5. **Verify API calls:**
   - Should see `/api/v1/admin/users` (not direct Render calls)
   - Should get 200 OK (not 401)
   - Should see data loading correctly

## Files Modified

1. `frontend/app/api/v1/[[...path]]/route.ts` - Fixed BFF proxy routing
2. `frontend/.env.local` - Updated environment configuration
3. `ACTUAL_FIX_SUMMARY.md` - This file

## Why Previous Approach Was Wrong

I initially tried to remove `/api` from all frontend fetch calls, but that was incorrect because:

1. The frontend code was actually correct - it needs to include `/api` in the path
2. The BFF proxy was the problem - it wasn't handling the backend's mixed routing
3. Removing `/api` from frontend would break direct Render calls (when BFF is disabled)

The correct fix was to make the BFF proxy smarter about which routes need `/api` prefix.

## Next Steps

1. ✅ Set `BACKEND_INTERNAL_URL` on Vercel
2. ✅ Redeploy Vercel (to pick up the BFF proxy fix)
3. ✅ Test authentication and admin endpoints
4. ✅ Verify no more 401 errors

The fix is now in place. Once you redeploy with the correct Vercel environment variable, everything should work!
