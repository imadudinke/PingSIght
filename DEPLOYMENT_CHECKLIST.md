# Render Deployment Checklist

Quick checklist for deploying PingSight backend to Render.

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All tests pass locally
- [ ] Database migrations work locally
- [ ] Environment variables documented

## Render Setup

### 1. PostgreSQL Database
- [ ] Create PostgreSQL database on Render
- [ ] Note the Internal Database URL
- [ ] Convert URL format: `postgresql://` → `postgresql+psycopg://`

### 2. Web Service
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `backend`
- [ ] Set Runtime: `Docker`
- [ ] Set Start Command:
  ```bash
  sh -c "alembic upgrade head && uvicorn app.main:app --host=0.0.0.0 --port=8000"
  ```

### 3. Environment Variables

Copy these to Render (Settings → Environment):

```env
# Database
DATABASE_URL=postgresql+psycopg://user:pass@host/db

# Security
SECRET_KEY=<generate with: openssl rand -hex 32>

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/callback

# URLs
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-app.onrender.com

# Environment
ENVIRONMENT=production
ENV=production

# CORS
CORS_ORIGINS=https://your-frontend.vercel.app

# Rate Limiting
RATE_LIMIT_HEARTBEAT=60/minute
RATE_LIMIT_API=200/minute

# Admin (IMPORTANT!)
ADMIN_SEED_EMAILS=imadudinkeremu@gmail.com
```

### 4. Google OAuth Setup
- [ ] Go to Google Cloud Console
- [ ] Add redirect URI: `https://your-app.onrender.com/auth/callback`
- [ ] Add authorized origin: `https://your-app.onrender.com`

### 5. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete
- [ ] Check logs for errors

## Post-Deployment Verification

- [ ] Health check works: `https://your-app.onrender.com/health`
- [ ] API docs accessible: `https://your-app.onrender.com/docs`
- [ ] OAuth login works: `https://your-app.onrender.com/auth/login`
- [ ] Log in with admin email: `imadudinkeremu@gmail.com`
- [ ] Verify admin access in dashboard
- [ ] Test creating a monitor
- [ ] Test all API endpoints

## Important Notes

✅ **Migrations run automatically** - No manual migration needed!

✅ **Admin email configured** - `imadudinkeremu@gmail.com` becomes admin on first login

✅ **Start command includes migrations** - Database updates on every deploy

## Common Issues

### Issue: Migration fails
**Solution:** Check `DATABASE_URL` format is `postgresql+psycopg://`

### Issue: OAuth doesn't work
**Solution:** Verify redirect URI in Google Console matches exactly

### Issue: CORS errors
**Solution:** Add frontend URL to `CORS_ORIGINS`

### Issue: Not admin after login
**Solution:** Check `ADMIN_SEED_EMAILS` environment variable is set

## Quick Commands

Generate secret key:
```bash
openssl rand -hex 32
```

Check migrations (in Render Shell):
```bash
alembic current
```

Make user admin manually (in Render Shell):
```bash
python make_admin.py user@example.com
```

## Support

- Full guide: See `RENDER_DEPLOYMENT.md`
- Admin setup: See `ADMIN_SETUP.md`
- Render docs: https://render.com/docs

---

**Your Admin Email:** `imadudinkeremu@gmail.com` 🎉
