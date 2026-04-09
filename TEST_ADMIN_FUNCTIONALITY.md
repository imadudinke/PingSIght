# Admin Functionality Test Guide

## What I've Built

### 🎯 Complete Admin Dashboard
- **AdminStats**: Shows system-wide statistics (users, monitors, heartbeats, etc.)
- **UserManagement**: List, activate, deactivate, and delete users
- **AdminManagement**: Grant and revoke admin privileges
- **BlockedEmails**: Block and unblock email addresses
- **Navigation**: Admin panel accessible from sidebar (only for admins)

### 🔧 Backend API Endpoints
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List users with pagination/search
- `PUT /api/admin/users/{id}/activate` - Activate user
- `PUT /api/admin/users/{id}/deactivate` - Deactivate user  
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/admins` - List admin users
- `POST /api/admin/admins/by-email` - Grant admin privileges
- `DELETE /api/admin/admins/{id}` - Revoke admin privileges
- `GET /api/admin/system/health` - System health metrics

### 🎨 UI Features
- **Sidebar Integration**: Admin panel link with special styling
- **Admin Badge**: Shows in header when user is admin
- **Responsive Design**: Works on mobile and desktop
- **Real-time Stats**: Live system metrics
- **Search & Filtering**: User management with search
- **Confirmation Modals**: Safe actions with confirmations

## Testing Instructions

### 1. Start the Application

**Backend:**
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Make Yourself Admin

Since you need admin privileges to access the admin panel, you'll need to manually set yourself as admin in the database:

**Option A: Direct Database Update**
```sql
-- Connect to your PostgreSQL database
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

**Option B: Python Script**
```python
# In backend directory with venv activated
python -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.models.user import User
from app.core.config import get_settings

async def make_admin():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Replace with your email
        email = 'your-email@example.com'
        
        result = await session.execute(
            update(User).where(User.email == email).values(is_admin=True)
        )
        await session.commit()
        print(f'Made {email} an admin')

asyncio.run(make_admin())
"
```

### 3. Test Admin Features

1. **Login** to your account
2. **Check Admin Badge** - Should see "🛡 ADMIN" badge in header
3. **Navigate to Admin Panel** - Click "ADMIN_PANEL" in sidebar
4. **Test Each Section**:

#### Admin Stats
- Should show real user count, monitor count, etc.
- Stats update automatically

#### User Management  
- View all registered users
- Search for specific users
- Try activating/deactivating a user
- Sort by different columns

#### Admin Management
- View current admins
- Try granting admin privileges to another user
- Try revoking admin privileges (be careful!)

#### Blocked Emails
- Add an email to block list
- View blocked emails
- Unblock an email

### 4. Test Security

1. **Non-Admin Access**: Create a regular user account and verify they can't access `/dashboard/admin`
2. **API Security**: Try calling admin endpoints without admin privileges (should get 403)
3. **Self-Protection**: Try to revoke your own admin privileges (should be prevented)

## Expected Behavior

### ✅ What Should Work
- Admin sidebar link only shows for admin users
- Admin badge appears in header for admins
- All admin API endpoints work with proper authentication
- User management functions (activate/deactivate/delete)
- Admin privilege management
- Real-time statistics display
- Responsive design on all screen sizes

### 🚫 What Should Be Blocked
- Non-admin users accessing admin routes
- Non-admin users calling admin API endpoints
- Deleting or deactivating admin users
- Revoking your own admin privileges
- Deleting your own account

## Troubleshooting

### Admin Panel Not Showing
1. Check if user has `is_admin = true` in database
2. Verify auth context is loading user data correctly
3. Check browser console for errors

### API Errors
1. Verify backend is running on port 8000
2. Check CORS configuration allows frontend origin
3. Ensure user is authenticated (has valid cookie)
4. Check backend logs for detailed error messages

### Database Issues
1. Ensure PostgreSQL is running
2. Check database connection string in `.env`
3. Run migrations: `alembic upgrade head`

## Architecture Notes

### Security Model
- **Role-Based Access**: Uses `is_admin` boolean flag
- **API Protection**: `require_admin()` dependency on all admin endpoints
- **Frontend Guards**: Admin routes protected by middleware and component checks
- **Self-Protection**: Prevents admins from removing their own privileges

### Data Flow
1. **Authentication**: User logs in → Cookie set → Auth context loads user data
2. **Admin Check**: Frontend checks `user.is_admin` → Shows/hides admin features
3. **API Calls**: Admin endpoints verify `is_admin` flag → Return data or 403
4. **Real-time Updates**: Stats refresh automatically, user actions update immediately

### Scalability Considerations
- **Pagination**: User list supports pagination for large user bases
- **Search**: Efficient database queries with LIKE searches
- **Caching**: Stats could be cached for better performance
- **Audit Logs**: Could add logging for admin actions

This admin system provides a solid foundation for managing your PingSight application with proper security, usability, and scalability considerations.