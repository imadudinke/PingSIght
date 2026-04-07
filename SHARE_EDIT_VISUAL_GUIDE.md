# Share Edit Feature - Visual Guide

## Before (Old Behavior)

When a monitor was shared, you could only see the URL:

```
┌────────────────────────────────────────────────────────┐
│ SHARE_MONITOR                                      [×] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ✓ PUBLIC_SHARING_ENABLED                              │
│   This monitor is now publicly accessible             │
│                                                        │
│ ⏰ EXPIRES: Apr 13, 2024, 10:00 AM                    │
│ 🔒 PASSWORD_PROTECTED                                 │
│                                                        │
│ PUBLIC_SHARE_LINK                                     │
│ ┌──────────────────────────────────────┐             │
│ │ http://localhost:3000/share/abc123   │ [COPY]     │
│ └──────────────────────────────────────┘             │
│                                                        │
│ • Share this link with anyone                         │
│ • Recipients need password to access                  │
│ • Link expires automatically                          │
│                                                        │
│ [DISABLE_PUBLIC_SHARING]                              │
│                                                        │
│ [CLOSE]                                               │
└────────────────────────────────────────────────────────┘
```

**Problem**: To change password or expiration, you had to:
1. Click "DISABLE_PUBLIC_SHARING"
2. Re-enable sharing with new settings
3. Get a NEW share URL
4. Share the new URL with everyone again

---

## After (New Behavior)

Now you can edit settings without changing the URL:

### Step 1: View Shared Monitor

```
┌────────────────────────────────────────────────────────┐
│ SHARE_MONITOR                                      [×] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ✓ PUBLIC_SHARING_ENABLED                              │
│   This monitor is now publicly accessible             │
│                                                        │
│ ⏰ EXPIRES: Apr 13, 2024, 10:00 AM                    │
│ 🔒 PASSWORD_PROTECTED                                 │
│                                                        │
│ PUBLIC_SHARE_LINK                                     │
│ ┌──────────────────────────────────────┐             │
│ │ http://localhost:3000/share/abc123   │ [COPY]     │
│ └──────────────────────────────────────┘             │
│                                                        │
│ ┌──────────────────────────────────────┐             │
│ │  [✏️] EDIT_SETTINGS                  │ ← NEW!     │
│ └──────────────────────────────────────┘             │
│                                                        │
│ • Share this link with anyone                         │
│ • Recipients need password to access                  │
│ • You can update settings at any time                 │
│                                                        │
│ [DISABLE_PUBLIC_SHARING]                              │
│                                                        │
│ [CLOSE]                                               │
└────────────────────────────────────────────────────────┘
```

### Step 2: Click "EDIT_SETTINGS"

```
┌────────────────────────────────────────────────────────┐
│ SHARE_MONITOR                                      [×] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ✓ PUBLIC_SHARING_ENABLED                              │
│   This monitor is now publicly accessible             │
│                                                        │
│ ⏰ EXPIRES: Apr 13, 2024, 10:00 AM                    │
│ 🔒 PASSWORD_PROTECTED                                 │
│                                                        │
│ PUBLIC_SHARE_LINK                                     │
│ ┌──────────────────────────────────────┐             │
│ │ http://localhost:3000/share/abc123   │ [COPY]     │
│ └──────────────────────────────────────┘             │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ UPDATE_SHARE_SETTINGS                          │   │
│ │                                                │   │
│ │ NEW_EXPIRATION                                 │   │
│ │ ┌────────────────────────────────────────┐    │   │
│ │ │ Keep current / Never expires        ▼ │    │   │
│ │ └────────────────────────────────────────┘    │   │
│ │                                                │   │
│ │ NEW_PASSWORD                                   │   │
│ │ ┌────────────────────────────────────────┐    │   │
│ │ │ Enter new password...                  │    │   │
│ │ └────────────────────────────────────────┘    │   │
│ │ Leave empty to keep current password           │   │
│ │                                                │   │
│ │ [UPDATE_SETTINGS]  [CANCEL]                   │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ • Share this link with anyone                         │
│ • You can update settings at any time                 │
│                                                        │
│ [DISABLE_PUBLIC_SHARING]                              │
│                                                        │
│ [CLOSE]                                               │
└────────────────────────────────────────────────────────┘
```

### Step 3: Update Settings

User can:
- **Change expiration**: Select from dropdown (1 hour to 1 year)
- **Update password**: Enter new password in field
- **Keep current**: Leave fields empty/default
- **Cancel**: Click CANCEL to close without saving

### Step 4: After Update

```
┌────────────────────────────────────────────────────────┐
│ SHARE_MONITOR                                      [×] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ✓ PUBLIC_SHARING_ENABLED                              │
│   This monitor is now publicly accessible             │
│                                                        │
│ ⏰ EXPIRES: Apr 20, 2024, 10:00 AM  ← UPDATED!        │
│ 🔒 PASSWORD_PROTECTED                                 │
│                                                        │
│ PUBLIC_SHARE_LINK                                     │
│ ┌──────────────────────────────────────┐             │
│ │ http://localhost:3000/share/abc123   │ [COPY]     │
│ └──────────────────────────────────────┘             │
│   ↑ SAME URL - No need to reshare!                   │
│                                                        │
│ ┌──────────────────────────────────────┐             │
│ │  [✏️] EDIT_SETTINGS                  │             │
│ └──────────────────────────────────────┘             │
│                                                        │
│ • Share this link with anyone                         │
│ • Recipients need NEW password to access              │
│ • Link expires at NEW time                            │
│                                                        │
│ [DISABLE_PUBLIC_SHARING]                              │
│                                                        │
│ [CLOSE]                                               │
└────────────────────────────────────────────────────────┘
```

---

## Use Cases

### Use Case 1: Rotate Password Weekly

**Scenario**: Security policy requires weekly password changes

**Old Way**:
1. Disable sharing (URL becomes invalid)
2. Re-enable with new password (get new URL)
3. Email new URL to all recipients
4. Recipients update bookmarks
5. Repeat every week 😫

**New Way**:
1. Click "EDIT_SETTINGS"
2. Enter new password
3. Click "UPDATE_SETTINGS"
4. Done! Same URL, new password ✅

### Use Case 2: Extend Expiration

**Scenario**: Share was set to expire in 1 day, but you need it for 1 week

**Old Way**:
1. Wait for share to expire
2. Re-enable sharing with 1 week expiration
3. Get new URL
4. Share new URL

**New Way**:
1. Click "EDIT_SETTINGS"
2. Select "1 week" from dropdown
3. Click "UPDATE_SETTINGS"
4. Expiration extended! ✅

### Use Case 3: Add Password Protection

**Scenario**: Share was public, now you want to add password

**Old Way**:
1. Disable sharing
2. Re-enable with password
3. Get new URL
4. Share new URL with password

**New Way**:
1. Click "EDIT_SETTINGS"
2. Enter password
3. Click "UPDATE_SETTINGS"
4. Password added! ✅

### Use Case 4: Remove Expiration

**Scenario**: Share was temporary, now you want it permanent

**Old Way**:
1. Disable sharing
2. Re-enable without expiration
3. Get new URL
4. Share new URL

**New Way**:
1. Click "EDIT_SETTINGS"
2. Select "Keep current / Never expires"
3. Click "UPDATE_SETTINGS"
4. Expiration removed! ✅

---

## Key Features

### 🎯 Same URL
- Share URL never changes
- Recipients don't need to update bookmarks
- No need to re-share links

### ⚡ Quick Updates
- Edit settings in seconds
- No need to disable/re-enable
- Changes take effect immediately

### 🔒 Security
- Easy password rotation
- Flexible expiration management
- Quick response to security needs

### 🎨 Clean Interface
- Inline editing (no new modal)
- Clear labels and hints
- Consistent with app design

### 🛡️ Safe Editing
- Cancel button prevents accidents
- Form resets on cancel
- Error messages if update fails

---

## Comparison Table

| Feature | Old Behavior | New Behavior |
|---------|-------------|--------------|
| **Change Password** | Disable → Re-enable → New URL | Edit → Update → Same URL |
| **Change Expiration** | Disable → Re-enable → New URL | Edit → Update → Same URL |
| **URL Stability** | ❌ Changes every time | ✅ Never changes |
| **Recipient Impact** | 😫 Must update bookmarks | 😊 No action needed |
| **Time Required** | ~30 seconds | ~5 seconds |
| **Steps Required** | 4-5 steps | 2 steps |
| **Risk of Error** | High (wrong settings) | Low (can cancel) |

---

## Tips for Users

### 💡 Best Practices

1. **Regular Password Rotation**
   - Change passwords weekly or monthly
   - Use strong, unique passwords
   - Keep a password manager

2. **Expiration Management**
   - Set expiration for temporary shares
   - Extend before expiration if needed
   - Remove expiration for permanent shares

3. **Security First**
   - Always use passwords for sensitive data
   - Set reasonable expiration times
   - Review share settings regularly

4. **Communication**
   - Notify recipients of password changes
   - Provide new password securely
   - Confirm access after updates

### ⚠️ Important Notes

- **Password changes are immediate**: Recipients need new password right away
- **Expiration updates apply to existing URL**: No grace period
- **Empty fields keep current values**: Don't worry about overwriting
- **Cancel is safe**: No changes until you click UPDATE

---

## Summary

The new edit feature makes share management:
- ✅ **Faster**: 2 steps instead of 5
- ✅ **Easier**: No URL changes needed
- ✅ **Safer**: Cancel option prevents mistakes
- ✅ **Better**: Consistent with app design

**Status**: Ready to use! Test it out on any shared monitor.
