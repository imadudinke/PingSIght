# PingSight Troubleshooting Guide

## Current Issue: CORS and 500 Error

### Symptoms
```
Access to fetch at 'http://localhost:8000/api/notifications/settings' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

GET http://localhost:8000/api/notifications/settings net::ERR_FAILED 500 (Internal Server Error)
```

### Root Cause
The backend is returning a 500 error because the database is missing the new Slack notification columns. The CORS error is a secondary symptom - browsers don't show CORS headers when the server returns a 500 error.

### Solution

**Step 1: Stop the backend** (if running)
```bash
# Press Ctrl+C in the terminal where backend is running
```

**Step 2: Run the migration fix script**
```bash
cd backend
./fix_migrations.sh
```

This will:
- Show current migration status
- Apply all pending migrations (including Slack)
- Verify the migrations were successful

**Step 3: Restart the backend**
```bash
cd backend
./start.sh
```

**Step 4: Verify it's working**
```bash
# In another terminal
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "ok",
  "message": "pingSight API is running",
  "scheduler": {...},
  "timestamp": "2026-04-07T..."
}
```

**Step 5: Test the notifications endpoint**
```bash
# This should return 401 (unauthorized) not 500
curl http://localhost:8000/api/notifications/settings
```

Expected response:
```json
{
  "detail": "Not authenticated"
}
```

If you get this, the backend is working correctly!

---

## Common Issues and Solutions

### Issue 1: "ModuleNotFoundError: No module named 'dotenv'"

**Cause**: Dependencies not installed

**Solution**:
```bash
cd backend
uv sync
```

### Issue 2: "alembic.util.exc.CommandError: Target database is not up to date"

**Cause**: Migrations out of sync

**Solution**:
```bash
cd backend
alembic current  # Check current version
alembic upgrade head  # Apply all migrations
```

### Issue 3: "sqlalchemy.exc.OperationalError: could not connect to server"

**Cause**: PostgreSQL not running

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # Linux
brew services list  # Mac

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # Mac
```

### Issue 4: "psycopg.OperationalError: connection failed: FATAL: database 'pingsight' does not exist"

**Cause**: Database not created

**Solution**:
```bash
# Create the database
createdb pingsight

# Or using psql
psql -U postgres -c "CREATE DATABASE pingsight;"
```

### Issue 5: "Port 8000 already in use"

**Cause**: Another process using port 8000

**Solution**:
```bash
# Find the process
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill it
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue 6: Frontend shows "Failed to fetch" or CORS errors

**Possible Causes**:
1. Backend not running
2. Backend returning 500 error (check backend logs)
3. Wrong API URL in frontend

**Solution**:
```bash
# 1. Check if backend is running
curl http://localhost:8000/health

# 2. Check backend logs
tail -f backend/backend.log

# 3. Verify frontend API URL
# Check frontend/.env.local has:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Issue 7: "column user_notification_settings.slack_webhook_url does not exist"

**Cause**: Slack migration not applied

**Solution**:
```bash
cd backend
./fix_migrations.sh
```

### Issue 8: Authentication not working after login

**Possible Causes**:
1. Cookie not being set
2. CORS credentials not enabled
3. Session expired

**Solution**:
```bash
# Check browser console for errors
# Verify cookies are being set (DevTools → Application → Cookies)

# Check backend CORS settings in app/main.py:
# allow_credentials=True should be set

# Clear cookies and try again
```

### Issue 9: Monitors not being checked

**Cause**: Scheduler not running

**Solution**:
```bash
# Check scheduler status
curl http://localhost:8000/health

# Look for "scheduler" section in response
# Should show active jobs

# Restart backend to restart scheduler
```

### Issue 10: Notifications not being sent

**Possible Causes**:
1. Webhook URL incorrect
2. Notifications disabled
3. Alert conditions not met

**Solution**:
```bash
# Test webhook from settings page
# Click "SEND_TEST_NOTIFICATION"

# Check backend logs for errors
tail -f backend/backend.log | grep -i notification

# Verify webhook URL format:
# Discord: https://discord.com/api/webhooks/...
# Slack: https://hooks.slack.com/services/...
```

---

## Debugging Tips

### Check Backend Logs
```bash
# Real-time logs
tail -f backend/backend.log

# Search for errors
grep -i error backend/backend.log

# Search for specific endpoint
grep -i "notifications/settings" backend/backend.log
```

### Check Database State
```bash
# Connect to database
psql -d pingsight

# Check tables
\dt

# Check notification settings table
SELECT * FROM user_notification_settings;

# Check if Slack columns exist
\d user_notification_settings
```

### Check Migration Status
```bash
cd backend

# Current migration
alembic current

# Migration history
alembic history

# Pending migrations
alembic upgrade head --sql  # Show SQL without applying
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Status endpoint
curl http://localhost:8000/api/status

# Notifications (will return 401 without auth)
curl http://localhost:8000/api/notifications/settings

# With authentication (get cookie from browser)
curl http://localhost:8000/api/notifications/settings \
  -H "Cookie: session=your-session-cookie"
```

### Check Frontend State
```bash
# Check if frontend is running
curl http://localhost:3000

# Check environment variables
cat frontend/.env.local

# Check build errors
cd frontend
npm run build
```

---

## Quick Fixes Checklist

When something goes wrong, try these in order:

1. ✅ Check if backend is running: `curl http://localhost:8000/health`
2. ✅ Check if database is running: `psql -d pingsight -c "SELECT 1;"`
3. ✅ Check migrations are applied: `cd backend && alembic current`
4. ✅ Check backend logs: `tail -f backend/backend.log`
5. ✅ Restart backend: Stop (Ctrl+C) and run `./start.sh`
6. ✅ Clear browser cache and cookies
7. ✅ Check frontend console for errors (F12)
8. ✅ Verify .env files exist and are correct

---

## Getting Help

If you're still stuck:

1. **Check the logs**: `backend/backend.log` has detailed error messages
2. **Check database**: `psql -d pingsight` to inspect data
3. **Check migrations**: `alembic current` and `alembic history`
4. **Check environment**: Verify .env files have correct values
5. **Check ports**: Make sure 8000 (backend) and 3000 (frontend) are available

---

## Prevention

To avoid issues in the future:

1. **Always run migrations** after pulling new code: `alembic upgrade head`
2. **Keep dependencies updated**: `uv sync` regularly
3. **Check logs** when things seem slow or broken
4. **Use the startup script**: `./start.sh` handles migrations automatically
5. **Backup your database** before major changes: `pg_dump pingsight > backup.sql`

---

## Emergency Reset

If everything is broken and you want to start fresh:

```bash
# ⚠️ WARNING: This will delete all data!

# 1. Drop and recreate database
dropdb pingsight
createdb pingsight

# 2. Run all migrations
cd backend
alembic upgrade head

# 3. Restart backend
./start.sh

# 4. Clear frontend cache
cd ../frontend
rm -rf .next
npm run dev
```
