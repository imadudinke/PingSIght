# 🚨 URGENT: Deploy Fix Now

## Current Problem

You're seeing these errors:
- ❌ `GET /api/v1/api/admin/users` - 500 Error (duplicate `/api`)
- ❌ `GET https://pingsight.onrender.com/monitors/` - 401 Unauthorized (bypassing BFF)

## Why This Is Happening

Your local code has the fix, but **Vercel is running the OLD code** without the BFF proxy fix.

## Fix Steps (Do This NOW)

### Step 1: Verify Latest Commit

```bash
git log --oneline -1
```

Should show: "Fix API router" or similar

### Step 2: Push to GitHub (if not already pushed)

```bash
git push origin main
```

### Step 3: Set Vercel Environment Variable

**THIS IS CRITICAL!** Go to Vercel Dashboard:

1. Open https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   ```
   Name: BACKEND_INTERNAL_URL
   Value: https://pingsight.onrender.com
   ```
5. Select **Production** environment
6. Click **Save**

### Step 4: Redeploy on Vercel

**Option A: Trigger from Dashboard**
1. Go to **Deployments** tab
2. Click the **...** menu on latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache: NO**
5. Click **Redeploy**

**Option B: Force Push**
```bash
git commit --allow-empty -m "trigger: force Vercel redeploy"
git push origin main
```

### Step 5: Wait for Deployment

- Watch the deployment in Vercel dashboard
- Should take 2-3 minutes
- Wait for "Deployment Ready" status

### Step 6: Clear Browser Cache

After deployment completes:

1. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Or open incognito/private window**
3. **Or clear all cookies** for pingsight.vercel.app

### Step 7: Test

1. Login to your app
2. Open DevTools → Network tab
3. Navigate to admin panel
4. Check API calls:
   - ✅ Should see: `/api/v1/admin/users` (NOT `/api/v1/api/admin/users`)
   - ✅ Should get: 200 OK (NOT 401 or 500)
   - ✅ Should NOT see direct calls to `pingsight.onrender.com`

## Expected Results

### Before Fix (Current - BROKEN)
```
❌ GET /api/v1/api/admin/users → 500 Error
❌ GET https://pingsight.onrender.com/monitors/ → 401 Unauthorized
```

### After Fix (Expected - WORKING)
```
✅ GET /api/v1/admin/users → 200 OK
✅ GET /api/v1/monitors/ → 200 OK
✅ All calls go through BFF proxy
```

## Troubleshooting

### If still seeing errors after deployment:

**1. Check Environment Variable**
```bash
# In Vercel dashboard, verify:
BACKEND_INTERNAL_URL=https://pingsight.onrender.com
```

**2. Check Deployment Logs**
- Go to Vercel → Deployments → Click latest
- Check "Building" logs for errors
- Check "Functions" logs for runtime errors

**3. Check Browser**
- Clear ALL cookies for pingsight.vercel.app
- Try incognito mode
- Check Network tab shows `/api/v1/` calls (not direct Render)

**4. Check Render Backend**
Make sure these are set on Render:
```bash
FRONTEND_URL=https://pingsight.vercel.app
CORS_ORIGINS=https://pingsight.vercel.app
AUTH_COOKIE_SAMESITE=lax
```

## Quick Commands

```bash
# Check current commit
git log --oneline -1

# Push if needed
git push origin main

# Force redeploy
git commit --allow-empty -m "deploy: force rebuild"
git push origin main
```

## What the Fix Does

The BFF proxy now correctly handles backend's mixed routing:

**Routes that need `/api` prefix:**
- `/admin/*` → proxied as `/api/admin/*`
- `/status-pages/*` → proxied as `/api/status-pages/*`
- `/notifications/*` → proxied as `/api/notifications/*`
- `/export/*` → proxied as `/api/export/*`

**Routes that DON'T need `/api` prefix:**
- `/monitors/*` → proxied as `/monitors/*`
- `/auth/*` → proxied as `/auth/*`

## Timeline

1. ⏱️ Push to GitHub: 10 seconds
2. ⏱️ Vercel build: 2-3 minutes
3. ⏱️ Clear cache: 5 seconds
4. ⏱️ Test: 30 seconds

**Total: ~4 minutes to fix**

## Need Help?

If errors persist after following ALL steps:
1. Share Vercel deployment logs
2. Share browser Network tab screenshot
3. Confirm `BACKEND_INTERNAL_URL` is set on Vercel
