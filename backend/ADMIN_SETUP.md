# Admin User Setup

This document explains how to configure and manage admin users in PingSight.

## Automatic Admin Promotion (Seed Emails)

PingSight supports automatic admin promotion for specific email addresses. When a user with a seed email logs in or registers, they are automatically granted admin privileges.

### Configuration

Add admin emails to your `.env` file:

```env
ADMIN_SEED_EMAILS=imadudinkeremu@gmail.com,admin@example.com,another@example.com
```

**Features:**
- Comma-separated list of emails
- Works for both OAuth (Google) and password registration
- Automatically promotes users on first login
- Upgrades existing users to admin on next login if they're in the seed list

### How It Works

1. **New User Registration/Login:**
   - When a user with a seed email logs in for the first time, they are automatically created as an admin
   - `is_admin` flag is set to `true` during user creation

2. **Existing User Login:**
   - If an existing non-admin user logs in and their email is in the seed list, they are automatically promoted to admin
   - This allows you to add admin emails to the list and have them promoted on next login

### Environment Files

Make sure to add `ADMIN_SEED_EMAILS` to all environment files:

- `.env` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Manual Admin Promotion

If you need to manually promote a user to admin, use the provided script:

```bash
# From the backend directory
python make_admin.py user@example.com
```

**Output:**
```
✓ Successfully promoted 'user@example.com' to admin.
```

Or if already admin:
```
✓ User 'user@example.com' is already an admin.
```

## Checking Admin Status

You can check if a user is an admin by:

1. **Via API:** Call `/auth/me` endpoint (requires authentication)
   ```json
   {
     "id": "uuid",
     "email": "user@example.com",
     "is_admin": true,
     "is_active": true,
     "created_at": "2026-04-09T..."
   }
   ```

2. **Via Database:** Query the users table
   ```sql
   SELECT email, is_admin, is_active FROM users WHERE email = 'user@example.com';
   ```

## Admin Privileges

Admin users have access to:
- User management (activate/deactivate users)
- Admin management (grant/revoke admin privileges)
- Blocked email management (block/unblock email addresses)
- System-wide monitoring and analytics

## Security Best Practices

1. **Limit Admin Emails:** Only add trusted email addresses to `ADMIN_SEED_EMAILS`
2. **Use Environment Variables:** Never hardcode admin emails in the application code
3. **Regular Audits:** Periodically review the list of admin users
4. **Separate Environments:** Use different admin emails for staging and production
5. **Revoke Access:** Remove emails from `ADMIN_SEED_EMAILS` and manually revoke admin status if needed

## Revoking Admin Access

To revoke admin access:

1. Remove the email from `ADMIN_SEED_EMAILS` in your `.env` file
2. Use the admin dashboard to revoke admin privileges
3. Or manually update the database:
   ```sql
   UPDATE users SET is_admin = false WHERE email = 'user@example.com';
   ```

## Default Admin

The default admin email is: `imadudinkeremu@gmail.com`

This email will automatically become an admin when logging in for the first time.
