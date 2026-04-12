# Vercel Production Setup Guide

## The Problem

You're getting 401 Unauthorized errors because:
1. Your frontend on Vercel is calling Render directly (`https://pingsight.onrender.com`)
2. Cookies set by Render don't work cross-origin (Vercel domain → Render domain)
3. The BFF (Backend-For-Frontend) proxy isn't being used

## The Solution

Use the BFF proxy so all API calls go through Vercel (`/api/v1/*`), which then proxies to Render server-side.

## Vercel Environment Variables

Go to your Vercel project settings → Environment Variables and set:

### Required Variables

```bash
# Backend URL (server-side only, not exposed to browser)
BACKEND_INTERNAL_URL=https://pingsight.onrender.com

# DO NOT set NEXT_PUBLIC_API_URL on Vercel
# DO NOT set NEXT_PUBLIC_BFF (defaults to 1 on Vercel)
```

### Optional Variables (if you need them)

```bash
# Only if you want to force BFF mode explicitly
NEXT_PUBLIC_BFF=1
```

## What NOT to Set

❌ **DO NOT** set `NEXT_PUBLIC_API_URL` on Vercel
❌ **DO NOT** set `NEXT_PUBLIC_BFF=0` on Vercel

These will cause the browser to call Render directly, breaking authentication.

## How It Works

### With BFF (Correct - What You Want)
```
Browser → Vercel (/api/v1/monitors) → Render (https://pingsight.onrender.com/monitors)
         ↑ Same origin, cookies work! ↑
```

### Without BFF (Wrong - Current Problem)
```
Browser → Render (https://pingsight.onrender.com/monitors)
         ↑ Cross-origin, cookies blocked! ↑
```

## Verification Steps

After setting the environment variables on Vercel:

1. **Redeploy your Vercel app** (environment changes require redeployment)
2. **Open browser DevTools** → Network tab
3. **Login to your app**
4. **Check API calls** - They should go to `/api/v1/*` NOT `https://pingsight.onrender.com/*`

Example of correct calls:
- ✅ `GET /api/v1/monitors/`
- ✅ `GET /api/v1/auth/me`
- ✅ `POST /api/v1/status-pages/`

Example of incorrect calls (what you're seeing now):
- ❌ `GET https://pingsight.onrender.com/monitors/`
- ❌ `GET https://pingsight.onrender.com/api/status-pages/`

## Backend Configuration (Render)

Your Render backend also needs these environment variables:

```bash
# Frontend URL (your Vercel deployment)
FRONTEND_URL=https://pingsight.vercel.app

# Backend URL (your Render deployment)
BACKEND_URL=https://pingsight.onrender.com

# CORS origins (include your Vercel domain)
CORS_ORIGINS=https://pingsight.vercel.app

# Cookie settings for BFF (same-site)
AUTH_COOKIE_SAMESITE=lax

# Environment
ENVIRONMENT=production
```

## Troubleshooting

### Still seeing direct Render calls?

1. Clear your browser cache and cookies
2. Check Vercel deployment logs for errors
3. Verify `BACKEND_INTERNAL_URL` is set on Vercel
4. Ensure you redeployed after setting environment variables

### Getting CORS errors?

- Make sure `CORS_ORIGINS` on Render includes your Vercel domain
- Check that `AUTH_COOKIE_SAMESITE=lax` on Render

### Admin endpoint 500 error?

The duplicate `/api/v1/api` path suggests a routing issue. Once BFF is working, this should resolve.

## Local Development

For local development, keep using:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This bypasses the BFF and calls your local backend directly.
