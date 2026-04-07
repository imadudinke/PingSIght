# PingSight - Quick Start Guide

## 🚀 Start Everything

### Backend
```bash
./restart_backend.sh
```
Or manually:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

## 🔗 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## ✨ New Features (Just Added)

### Enhanced Monitor Sharing
1. Navigate to any monitor
2. Click three-dots menu → Share
3. Configure:
   - **Expiration**: 1 hour to 1 year (or never)
   - **Password**: Optional 4-50 character password
4. Copy and share the URL

### Public Share Page
- Share URL format: `http://localhost:3000/share/{token}`
- Password prompt appears if protected
- Shows "expired" message if past expiration
- Full monitor details visible to anyone with access

## 🐛 Recent Bug Fixes

### Response Handling
Fixed "Cannot read properties of undefined" errors in:
- Monitor list loading
- Authentication checks
- Monitor deletion
- Share creation

### CORS Configuration
- Backend properly configured for cross-origin requests
- All endpoints accessible from frontend
- Preflight requests handled correctly

## 📝 Common Tasks

### Create a Monitor
1. Click "NEW_MONITOR" button
2. Choose type: Simple, Scenario, or Heartbeat
3. Fill in details
4. Click "CREATE_MONITOR"

### Share a Monitor
1. Find monitor in list
2. Click three-dots → Share
3. Set expiration (optional)
4. Set password (optional)
5. Click "ENABLE_PUBLIC_SHARING"
6. Copy URL and share

### View Shared Monitor
1. Open share URL
2. Enter password if prompted
3. View monitor status and metrics

### Disable Sharing
1. Click three-dots → Share
2. Click "DISABLE_PUBLIC_SHARING"
3. Confirm

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
lsof -i :8000

# Kill existing process
pkill -f "uvicorn app.main:app"

# Restart
./restart_backend.sh
```

### Frontend Errors
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Database Issues
```bash
cd backend
source .venv/bin/activate

# Check current migration
alembic current

# Run migrations
alembic upgrade head
```

### CORS Errors
1. Restart backend: `./restart_backend.sh`
2. Clear browser cache
3. Try incognito mode
4. Check backend logs: `tail -f backend/backend.log`

## 📊 View Logs

### Backend Logs
```bash
tail -f backend/backend.log
```

### Frontend Logs
Check browser console (F12)

## 🧪 Testing

### Test Backend Endpoints
```bash
cd backend
python test_share_endpoint.py
```

### Test Share Feature
1. Create a monitor
2. Share it with password
3. Open share URL in incognito
4. Enter password
5. Verify monitor loads

### Test Expiration
1. Create share with 1 hour expiration
2. Note the expiration time
3. Wait for expiration (or manually change DB)
4. Try accessing share
5. Should see "expired" message

## 📚 Documentation

- **Complete Feature Docs**: `SHARE_ENHANCEMENT_SUMMARY.md`
- **Restart Guide**: `RESTART_BACKEND_GUIDE.md`
- **CORS Fix Details**: `CORS_FIX_COMPLETE.md`

## 🎯 Quick Commands

```bash
# Restart everything
./restart_backend.sh && cd frontend && npm run dev

# View all logs
tail -f backend/backend.log

# Check backend status
curl http://localhost:8000/health

# Check frontend status
curl http://localhost:3000

# Run database migration
cd backend && source .venv/bin/activate && alembic upgrade head

# Test API endpoints
cd backend && python test_share_endpoint.py
```

## 🔐 Security Notes

### Password Protection
- Passwords are hashed with bcrypt
- Never stored in plain text
- Secure comparison on verification

### Expiration
- Timezone-aware timestamps
- Automatic checking on access
- Clear error messages

### Share Tokens
- Cryptographically secure random tokens
- 32-byte URL-safe strings
- Unique per monitor

## 📱 Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Responsive design

## 🎨 UI Features

- Terminal-style aesthetic
- Dark theme throughout
- Monospace fonts
- Clean, minimal design
- Responsive layout
- Smooth animations

## 💡 Tips

1. **Use expiration** for temporary shares
2. **Add passwords** for sensitive monitors
3. **Copy share URLs** with one click
4. **Check expiration time** before sharing
5. **Disable sharing** when no longer needed
6. **Use incognito** to test public access
7. **Clear cache** if seeing old data

## 🚨 Known Issues

None currently! All features working as expected.

## 📞 Need Help?

1. Check documentation files
2. Review backend logs
3. Check browser console
4. Verify backend is running
5. Confirm database migration applied
6. Test with curl/Postman

---

**Version**: 1.0.0
**Last Updated**: 2026-04-06
**Status**: ✅ All Systems Operational
