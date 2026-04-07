# Backend Restart Guide

## Issue
The new sharing endpoints with expiration and password protection have been added, but the backend server needs to be restarted to load these new routes.

## Error Symptoms
- CORS errors when trying to access `/monitors/{id}/share`
- "Failed to load resource: net::ERR_FAILED"
- "No 'Access-Control-Allow-Origin' header is present"

## Solution: Restart the Backend Server

### Step 1: Stop the Current Backend Server

If the backend is running, stop it:
- Press `Ctrl+C` in the terminal where it's running
- Or find and kill the process:
  ```bash
  # Find the process
  ps aux | grep uvicorn
  
  # Kill it (replace PID with actual process ID)
  kill <PID>
  ```

### Step 2: Restart the Backend Server

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/bin/activate

# Start the server with auto-reload
uvicorn app.main:app --reload
```

### Step 3: Verify the Server Started

You should see output like:
```
INFO:     Will watch for changes in these directories: ['/path/to/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 4: Test the Endpoints

#### Option A: Use the Test Script
```bash
cd backend
python test_share_endpoint.py
```

#### Option B: Manual Test with curl
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:8000/monitors/test-id/share \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should see Access-Control-Allow-Origin header in response
```

#### Option C: Check API Docs
1. Open http://localhost:8000/docs
2. Look for the new endpoints:
   - `POST /monitors/{monitor_id}/share`
   - `DELETE /monitors/{monitor_id}/share`
   - `POST /monitors/shared/{share_token}/access`
   - `GET /monitors/shared/{share_token}`

### Step 5: Test from Frontend

1. Open http://localhost:3000
2. Login to your account
3. Navigate to a monitor
4. Click the share button (three dots menu → Share)
5. Try creating a share with:
   - No expiration, no password
   - With expiration (e.g., 1 day)
   - With password
   - With both expiration and password

## Common Issues

### Issue: Port 8000 Already in Use
```
ERROR:    [Errno 98] Address already in use
```

**Solution**:
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue: Module Import Errors
```
ModuleNotFoundError: No module named 'bcrypt'
```

**Solution**:
```bash
# Make sure virtual environment is activated
source .venv/bin/activate

# Reinstall dependencies
uv pip install -e .
```

### Issue: Database Migration Not Applied
```
sqlalchemy.exc.ProgrammingError: column "share_expires_at" does not exist
```

**Solution**:
```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### Issue: CORS Still Not Working

**Check**:
1. Backend is actually restarted (check the startup logs)
2. Frontend is using the correct URL (http://localhost:8000)
3. Browser cache is cleared
4. No browser extensions blocking requests

**Solution**:
```bash
# Clear browser cache
# Or use incognito/private mode

# Verify CORS in main.py
# Should have:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Verification Checklist

After restarting, verify:
- [ ] Backend starts without errors
- [ ] API docs show new endpoints at http://localhost:8000/docs
- [ ] CORS preflight requests succeed
- [ ] Frontend can create shares
- [ ] Expiration options work
- [ ] Password protection works
- [ ] Public share page loads
- [ ] Password prompt appears for protected shares

## Production Deployment

For production deployment:

1. **Update CORS settings** in `backend/app/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://yourdomain.com",
           "https://www.yourdomain.com"
       ],
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       allow_headers=["*"],
   )
   ```

2. **Run migration**:
   ```bash
   alembic upgrade head
   ```

3. **Restart application server** (depends on your deployment):
   - Docker: `docker-compose restart backend`
   - Systemd: `sudo systemctl restart pingsight-backend`
   - PM2: `pm2 restart pingsight-backend`
   - Kubernetes: `kubectl rollout restart deployment/pingsight-backend`

4. **Verify deployment**:
   - Check logs for startup messages
   - Test endpoints with curl or Postman
   - Verify frontend can access new features

## Need Help?

If you're still experiencing issues:

1. Check the backend logs for errors
2. Verify database migration was applied: `alembic current`
3. Test endpoints directly with curl or Postman
4. Check browser console for detailed error messages
5. Verify environment variables are set correctly

## Quick Reference

```bash
# Start backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Run migration
cd backend && source .venv/bin/activate && alembic upgrade head

# Test endpoints
cd backend && python test_share_endpoint.py

# Check current migration
cd backend && source .venv/bin/activate && alembic current

# View API docs
open http://localhost:8000/docs
```
