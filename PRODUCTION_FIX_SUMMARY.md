# Production 401 Unauthorized Fix - Summary

## Root Cause

Your Vercel frontend is calling Render backend directly instead of using the BFF (Backend-For-Frontend) proxy. This causes:

1. **Cross-origin cookie issues** - Cookies set by `pingsight.onrender.com` don't work on `pingsight.vercel.app`
2. **401 Unauthorized errors** - No auth cookie = no authentication
3. **CORS complications** - Cross-origin requests are blocked

## What Was Fixed

### 1. Frontend Environment Configuration

**File: `frontend/.env.local`**

Changed from:
```bash
NEXT_PUBLIC_API_URL=https://pingsight.onrender.com
```

To:
```bash
# Local development - connect directly to backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production on Vercel, DO NOT set NEXT_PUBLIC_API_URL
# The BFF proxy will handle routing to Render via BACKEND_INTERNAL_URL
```

## Required Actions on Vercel

### Step 1: Set Environment Variables

Go to your Vercel project → Settings → Environment Variables:

```bash
# Required - Backend URL for server-side proxy
BACKEND_INTERNAL_URL=https://pingsight.onrender.com

# DO NOT SET these on Vercel:
# ❌ NEXT_PUBLIC_API_URL
# ❌ NEXT_PUBLIC_BFF=0
```

### Step 2: Redeploy

After setting environment variables, trigger a new deployment:
- Go to Deployments tab
- Click "Redeploy" on the latest deployment
- OR push a new commit to trigger automatic deployment

## Required Actions on Render

Ensure these environment variables are set on your Render backend:

```bash
# Frontend URL (your Vercel deployment)
FRONTEND_URL=https://pingsight.vercel.app

# Backend URL (your Render deployment)  
BACKEND_URL=https://pingsight.onrender.com

# CORS origins (must include Vercel domain)
CORS_ORIGINS=https://pingsight.vercel.app

# Cookie settings for same-site BFF
AUTH_COOKIE_SAMESITE=lax

# Environment
ENVIRONMENT=production

# Your other existing variables (database, secrets, etc.)
DATABASE_URL=...
SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## How to Verify the Fix

### 1. Check API Calls in Browser

Open DevTools → Network tab and look for API calls:

**✅ Correct (using BFF):**
```
GET /api/v1/monitors/
GET /api/v1/auth/me
POST /api/v1/status-pages/
```

**❌ Wrong (direct to Render):**
```
GET https://pingsight.onrender.com/monitors/
GET https://pingsight.onrender.com/api/status-pages/
```

### 2. Check Cookies

In DevTools → Application → Cookies:
- Should see `access_token` cookie for your Vercel domain
- Cookie should have `SameSite=Lax` and `HttpOnly=true`

### 3. Test Authentication Flow

1. Login via Google OAuth or password
2. Navigate to dashboard
3. Should see your monitors without 401 errors
4. Check Network tab - all API calls should be to `/api/v1/*`

## Architecture Diagram

### Before (Broken)
```
┌─────────┐                    ┌─────────┐
│ Browser │ ──────────────────>│ Render  │
│         │  Direct API calls  │ Backend │
└─────────┘  (Cross-origin)    └─────────┘
             ❌ Cookies blocked
```

### After (Fixed)
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │────>│ Vercel  │────>│ Render  │
│         │     │   BFF   │     │ Backend │
└─────────┘     └─────────┘     └─────────┘
  Same-origin    Server-side
  ✅ Cookies      proxy
     work!
```

## Technical Details

### BFF Proxy Route
- **Location:** `frontend/app/api/v1/[[...path]]/route.ts`
- **Function:** Proxies all `/api/v1/*` requests to Render
- **Benefits:**
  - Same-origin cookies work
  - No CORS issues
  - Secure (backend URL not exposed to browser)
  - Handles OAuth redirects properly

### Cookie Configuration
- **Name:** `access_token`
- **HttpOnly:** `true` (prevents XSS)
- **Secure:** `true` (HTTPS only in production)
- **SameSite:** `lax` (allows OAuth redirects)
- **Path:** `/`
- **Max-Age:** 24 hours

### Environment Detection
The frontend automatically detects Vercel and enables BFF:

```typescript
// In getApiBaseUrl()
if (host.endsWith(".vercel.app")) {
  return BFF_API_PREFIX; // "/api/v1"
}
```

## Troubleshooting

### Still seeing 401 errors?

1. **Clear browser cache and cookies completely**
2. **Verify Vercel environment variables are set**
3. **Check you redeployed after setting variables**
4. **Inspect Network tab** - are calls going to `/api/v1/*`?

### Getting CORS errors?

- Check `CORS_ORIGINS` on Render includes your Vercel domain
- Verify `FRONTEND_URL` is set correctly on Render

### OAuth not working?

- Check `GOOGLE_REDIRECT_URI` on Render (should be `https://pingsight.onrender.com/auth/callback`)
- Verify Google OAuth console has correct redirect URIs
- Check Render logs for OAuth errors

### Admin endpoint 500 error?

The duplicate `/api/v1/api` path will be fixed once BFF is working correctly. This was caused by the frontend trying to construct URLs with both the base URL and the path.

## Local Development

Local development is unaffected. Continue using:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This bypasses BFF and calls your local backend directly, which is fine for development.

## Files Modified

1. `frontend/.env.local` - Updated to use localhost for development
2. `VERCEL_SETUP.md` - Created comprehensive setup guide
3. `PRODUCTION_FIX_SUMMARY.md` - This file

## Next Steps

1. ✅ Set `BACKEND_INTERNAL_URL` on Vercel
2. ✅ Remove `NEXT_PUBLIC_API_URL` from Vercel (if set)
3. ✅ Verify Render environment variables
4. ✅ Redeploy Vercel
5. ✅ Test authentication flow
6. ✅ Verify API calls in Network tab

Once these steps are complete, your 401 errors should be resolved!
