# Share Settings Edit Feature

## Overview
Enhanced the ShareMonitorModal to allow users to edit password and expiration settings for already-shared monitors without having to disable and re-enable sharing.

## Problem
Previously, once a monitor was shared, users could only:
- View the share URL
- Copy the URL
- Disable sharing completely

If they wanted to change the password or expiration, they had to:
1. Disable sharing (losing the share token)
2. Re-enable sharing with new settings (getting a new share token)
3. Share the new URL with everyone again

## Solution
Added an "EDIT_SETTINGS" button that allows users to update:
- **Expiration time**: Change or remove expiration
- **Password**: Update or add password protection

The share URL remains the same, so existing links continue to work with the new settings.

## Features

### 1. Edit Settings Button
When a monitor is shared, users now see an "EDIT_SETTINGS" button below the share URL.

**Visual Design**:
- Terminal-style button with edit icon
- Hover effect changes border to yellow
- Consistent with app aesthetic

### 2. Edit Mode Interface
Clicking "EDIT_SETTINGS" reveals an inline form with:

#### Expiration Dropdown
- **Options**: Keep current, 1 hour, 6 hours, 1 day, 1 week, 1 month, 1 year
- **Default**: "Keep current / Never expires"
- **Behavior**: Only updates if a new value is selected

#### Password Input
- **Placeholder**: "Enter new password (leave empty to keep current)"
- **Type**: Password field (hidden characters)
- **Behavior**: Only updates if a new password is entered
- **Hint**: Clear instruction about leaving empty to keep current

#### Action Buttons
- **UPDATE_SETTINGS**: Saves changes (yellow button)
- **CANCEL**: Closes edit mode without saving (gray button)

### 3. Update Behavior
When "UPDATE_SETTINGS" is clicked:
1. Sends POST request to `/monitors/{id}/share` with new settings
2. Backend updates the monitor's share settings
3. Share token remains the same
4. Modal updates to show new expiration/password status
5. Edit mode closes automatically
6. Success feedback shown

### 4. Visual Feedback
- **Loading state**: "UPDATING..." text while processing
- **Error handling**: Shows error message if update fails
- **Success indication**: Edit mode closes, updated info displayed
- **Highlighted section**: Edit form has yellow border to indicate active state

## User Experience Flow

### Scenario 1: Update Password
1. User opens share modal for shared monitor
2. Clicks "EDIT_SETTINGS"
3. Enters new password in password field
4. Clicks "UPDATE_SETTINGS"
5. Password is updated, share URL stays the same
6. Recipients now need new password to access

### Scenario 2: Add Expiration
1. User opens share modal for shared monitor (no expiration set)
2. Clicks "EDIT_SETTINGS"
3. Selects "1 week" from expiration dropdown
4. Clicks "UPDATE_SETTINGS"
5. Share now expires in 1 week
6. Existing share URL works until expiration

### Scenario 3: Remove Password
1. User opens share modal for password-protected share
2. Clicks "EDIT_SETTINGS"
3. Leaves password field empty
4. Selects new expiration or leaves as is
5. Clicks "UPDATE_SETTINGS"
6. Password is removed (if backend supports this)

### Scenario 4: Cancel Edit
1. User clicks "EDIT_SETTINGS"
2. Makes some changes
3. Clicks "CANCEL"
4. Edit mode closes
5. No changes are saved
6. Form is reset

## Technical Implementation

### Frontend Changes
**File**: `frontend/components/monitors/ShareMonitorModal.tsx`

#### New State
```typescript
const [isEditing, setIsEditing] = useState(false);
```

#### New Function
```typescript
const handleUpdateSettings = async () => {
  // Sends POST request with new settings
  // Updates shareInfo state
  // Closes edit mode on success
}
```

#### UI Structure
```
Share URL View
├── Share URL Display (with copy button)
├── Edit Settings Button (when not editing)
│   └── Opens edit mode
├── Edit Form (when editing)
│   ├── Expiration Dropdown
│   ├── Password Input
│   └── Action Buttons (Update/Cancel)
└── Disable Sharing Button
```

### Backend Compatibility
The feature uses the existing `POST /monitors/{id}/share` endpoint:
- Sending new settings updates the existing share
- Share token remains unchanged
- Only provided fields are updated
- Empty/null fields keep current values

### API Request
```json
POST /monitors/{monitor_id}/share
{
  "expires_in_hours": 168,  // Optional: new expiration
  "password": "newpass123"   // Optional: new password
}
```

### API Response
```json
{
  "success": true,
  "share_token": "same-token-as-before",
  "share_url": "http://localhost:3000/share/same-token-as-before",
  "is_public": true,
  "expires_at": "2024-04-13T10:00:00Z",
  "has_password": true
}
```

## Visual Design

### Edit Button
```
┌─────────────────────────────────────┐
│  [✏️] EDIT_SETTINGS                 │
└─────────────────────────────────────┘
```

### Edit Form (Expanded)
```
┌─────────────────────────────────────┐
│ UPDATE_SHARE_SETTINGS               │
│                                     │
│ NEW_EXPIRATION                      │
│ [Keep current / Never expires ▼]   │
│                                     │
│ NEW_PASSWORD                        │
│ [••••••••••••••••••••••••••]       │
│ Leave empty to keep current         │
│                                     │
│ [UPDATE_SETTINGS] [CANCEL]         │
└─────────────────────────────────────┘
```

## Benefits

### For Users
1. **No URL changes**: Existing share links continue to work
2. **Quick updates**: Change settings without re-sharing
3. **Flexible control**: Update password or expiration independently
4. **Clear interface**: Obvious how to edit settings
5. **Safe editing**: Cancel button prevents accidental changes

### For Recipients
1. **Same URL**: Don't need to update bookmarks
2. **Seamless transition**: New password takes effect immediately
3. **No disruption**: Access continues with new credentials

### For Security
1. **Password rotation**: Easy to change passwords regularly
2. **Expiration management**: Extend or shorten share lifetime
3. **Access control**: Quick response to security concerns

## Edge Cases Handled

### 1. Empty Fields
- Empty password field = keep current password
- No expiration selected = keep current expiration
- Both empty = no changes made (but request still sent)

### 2. Loading State
- Buttons disabled during update
- "UPDATING..." text shown
- Prevents double-submission

### 3. Error Handling
- Network errors caught and displayed
- Invalid inputs rejected by backend
- Error message shown in red banner
- Edit mode stays open for correction

### 4. Cancel Behavior
- Form fields reset to empty
- Edit mode closes
- No API request made
- Error messages cleared

## Testing Checklist

### Functional Tests
- [ ] Edit button appears for shared monitors
- [ ] Edit button opens edit form
- [ ] Expiration dropdown shows all options
- [ ] Password field accepts input
- [ ] Update button sends request
- [ ] Settings update successfully
- [ ] Share URL remains unchanged
- [ ] Cancel button closes edit mode
- [ ] Cancel button resets form
- [ ] Error messages display correctly

### Visual Tests
- [ ] Edit button styled correctly
- [ ] Edit form has yellow border
- [ ] Form fields properly aligned
- [ ] Buttons have correct colors
- [ ] Loading state shows correctly
- [ ] Success state updates display
- [ ] Mobile responsive layout

### Integration Tests
- [ ] Update password only
- [ ] Update expiration only
- [ ] Update both password and expiration
- [ ] Update with empty fields (no change)
- [ ] Update after initial share creation
- [ ] Multiple updates in sequence
- [ ] Update then disable sharing
- [ ] Update then close modal

## Future Enhancements

### Potential Improvements
1. **Show current values**: Display current password (masked) and expiration
2. **Remove password option**: Explicit "Remove password" checkbox
3. **Remove expiration option**: Explicit "Remove expiration" button
4. **Change history**: Log of all setting changes
5. **Bulk update**: Update settings for multiple shares at once
6. **Templates**: Save common setting combinations
7. **Notifications**: Alert when settings are changed
8. **Audit log**: Track who changed settings and when

### Advanced Features
1. **Scheduled changes**: Set future password/expiration changes
2. **Conditional access**: Different passwords for different users
3. **Access analytics**: See who accessed with which settings
4. **Auto-rotation**: Automatically change password periodically
5. **Expiration warnings**: Notify before share expires

## Documentation Updates

### User Guide
Add section: "Editing Share Settings"
- How to access edit mode
- What can be changed
- How changes affect existing shares
- Best practices for password rotation

### API Documentation
Update endpoint documentation:
- Clarify that POST updates existing shares
- Document which fields are optional
- Explain empty field behavior
- Add examples for common scenarios

## Deployment Notes

### No Backend Changes Required
This feature uses the existing backend API, so:
- No database migration needed
- No new endpoints required
- No backend restart necessary
- Only frontend deployment needed

### Deployment Steps
1. Deploy updated frontend code
2. Clear browser cache (or use cache busting)
3. Test edit functionality
4. Verify share URLs remain unchanged
5. Confirm password updates work

## Summary

The share settings edit feature provides a seamless way for users to update password and expiration settings without disrupting existing share links. The interface is intuitive, the implementation is robust, and the user experience is smooth.

**Key Benefits**:
- ✅ No URL changes needed
- ✅ Quick and easy updates
- ✅ Clear visual feedback
- ✅ Safe with cancel option
- ✅ Consistent with app design

**Status**: ✅ Complete and ready for testing
