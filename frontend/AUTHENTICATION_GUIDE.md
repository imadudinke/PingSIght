# PingSight Authentication & Dashboard Guide

## ✅ Setup Complete

### What's Been Implemented

1. **OpenAPI Client Generation**
   - Generated TypeScript client from FastAPI OpenAPI spec
   - Located in: `app/client/`
   - Command: `npm run generate:api`

2. **AuthContext** (`contexts/AuthContext.tsx`)
   - Centralized authentication state management
   - JWT token stored in secure cookies (7-day expiry)
   - Automatic token injection in API requests
   - User session management

3. **Login Modal** (`components/LoginModal.tsx`)
   - Login/Register toggle
   - Form validation
   - Error handling
   - Obsidian Dark theme

4. **Protected Dashboard** (`app/dashboard/page.tsx`)
   - Auto-redirects unauthenticated users to landing page
   - Real-time monitor display with emerald green status LEDs
   - Obsidian Dark design (#0B0E14 background)
   - Live data refresh every 30 seconds

5. **Landing Page** (`app/page.tsx`)
   - Auto-redirects authenticated users to dashboard
   - Login modal integration
   - PingSight-specific content

## 🚀 How to Use

### 1. Start Backend (if not running)
```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (if not running)
```bash
cd frontend
npm run dev
```

### 3. Test Authentication Flow

#### Register New Account
1. Go to http://localhost:3000
2. Click **LOGIN** button (top right)
3. Click "NEED_ACCOUNT? REGISTER"
4. Enter email: `test@example.com`
5. Enter password: `testpassword123`
6. Click **CREATE_ACCOUNT**
7. Auto-redirects to dashboard

#### Login Existing Account
1. Go to http://localhost:3000
2. Click **LOGIN** button
3. Enter credentials
4. Click **LOGIN**
5. Auto-redirects to dashboard

#### View Dashboard
- URL: http://localhost:3000/dashboard
- Shows all your monitors with real-time status
- Emerald green LEDs for operational monitors
- Red LEDs for down/degraded monitors

#### Logout
- Click **LOGOUT** in sidebar
- Redirects to landing page
- Token removed from cookies

## 🔐 Authentication Details

### Token Storage
- **Location**: Browser cookies
- **Name**: `access_token`
- **Type**: JWT (JSON Web Token)
- **Expiry**: 7 days
- **Security**: HttpOnly recommended for production

### API Endpoints Used
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user
- `GET /api/monitors/` - Fetch monitors (requires auth)

### Authorization Header
All authenticated requests automatically include:
```
Authorization: Bearer <jwt_token>
```

## 🎨 Design System

### Obsidian Dark Theme
- **Background**: `#0B0E14`
- **Panels**: `#151922`
- **Borders**: `#1f2937`
- **Text Primary**: `#e0e0e0`
- **Text Secondary**: `#888`
- **Text Muted**: `#555`

### Status Colors
- **Operational**: `#10b981` (Emerald green)
- **Warning**: `#f59e0b` (Amber)
- **Critical**: `#ef4444` (Red)
- **Pending**: `#6b7280` (Gray)
- **Accent**: `#a5b9ff` (Blue)

### Status LEDs
- Pulsing animation
- Box shadow glow effect
- Color-coded by status

## 📁 File Structure

```
frontend/
├── app/
│   ├── client/              # Generated OpenAPI client
│   ├── dashboard/
│   │   └── page.tsx         # Protected dashboard
│   ├── layout.tsx           # Root layout with AuthProvider
│   ├── page.tsx             # Landing page
│   └── globals.css
├── components/
│   └── LoginModal.tsx       # Login/Register modal
├── contexts/
│   └── AuthContext.tsx      # Auth state management
├── lib/
│   └── api.ts               # API utilities (legacy)
└── .env.local               # Environment variables
```

## 🔄 Data Flow

### Login Flow
```
1. User enters credentials in LoginModal
2. AuthContext.login() called
3. POST /api/auth/login with form data
4. JWT token returned
5. Token stored in cookie
6. Token added to client config
7. User data fetched from /api/auth/me
8. isAuthenticated = true
9. Redirect to /dashboard
```

### Dashboard Data Flow
```
1. Dashboard checks isAuthenticated
2. If false → redirect to /
3. If true → fetch monitors
4. GET /api/monitors/ with Bearer token
5. Display monitors with status LEDs
6. Auto-refresh every 30 seconds
```

### Logout Flow
```
1. User clicks LOGOUT
2. AuthContext.logout() called
3. Cookie removed
4. Client config cleared
5. User state = null
6. Redirect to landing page
```

## 🧪 Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Token stored in cookie (check DevTools)
- [ ] Auto-redirect to dashboard after login
- [ ] Dashboard shows monitors (if any exist)
- [ ] Status LEDs display correctly
- [ ] Logout removes token
- [ ] Auto-redirect to landing after logout
- [ ] Protected route blocks unauthenticated access
- [ ] Landing page redirects authenticated users

## 🔧 Regenerate API Client

If backend API changes, regenerate the client:

```bash
cd frontend
npm run generate:api
```

This will:
- Fetch latest OpenAPI spec from backend
- Generate TypeScript types and services
- Update `app/client/` directory

## 🚨 Troubleshooting

### "Failed to fetch monitors"
- Check backend is running on port 8000
- Verify token in cookies (DevTools → Application → Cookies)
- Check browser console for CORS errors

### "Unauthorized" errors
- Token may have expired
- Logout and login again
- Check token format in cookie

### Dashboard not loading
- Verify you're logged in
- Check AuthContext isAuthenticated state
- Look for redirect loops in console

### CORS errors
- Backend CORS should allow http://localhost:3000
- Check `app/main.py` CORS configuration

## 🎯 Next Steps

1. Create monitor creation form
2. Add monitor detail view with heartbeat history
3. Implement real-time updates with WebSockets
4. Add charts for latency trends
5. Implement alert notifications
6. Add status page builder

## 📊 Dashboard Features

Current dashboard includes:
- ✅ System uptime percentage
- ✅ Active incidents counter
- ✅ Average latency display
- ✅ Monitor list with status LEDs
- ✅ SSL certificate status
- ✅ Monitor type badges
- ✅ Check interval display
- ✅ System topology visualization
- ✅ Annotation logs
- ✅ Real-time status updates

The authentication system is fully functional with cookie-based JWT storage and protected routes!
