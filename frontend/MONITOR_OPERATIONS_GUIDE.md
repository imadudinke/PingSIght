# Monitor Operations Guide

## Quick Reference

### Available Operations
1. **Create** - Add new monitor
2. **Edit** - Update monitor settings
3. **Delete** - Remove monitor permanently
4. **Maintenance** - Pause/resume monitoring

## How to Use

### Creating a Monitor
1. Click "+ NEW_MONITOR" button on dashboard
2. Select monitor type (Simple/Scenario/Heartbeat)
3. Fill in required fields
4. Click "CREATE_MONITOR"

**See:** `MONITOR_CREATION_GUIDE.md` for detailed creation instructions

### Editing a Monitor
1. Click the three-dot menu button (⋮) on the monitor row
2. A dropdown menu will appear below the button
3. Select "EDIT_MONITOR"
4. Update fields as needed
5. Click "UPDATE_MONITOR"

**Editable Fields:**
- Friendly name
- Check interval (30-3600 seconds)
- Active status (on/off)

**Non-Editable Fields:**
- Monitor type (Simple/Scenario/Heartbeat)
- URL (immutable for data integrity)
- Steps (for scenario monitors)

### Deleting a Monitor
1. Click the three-dot menu button (⋮) on the monitor row
2. A dropdown menu will appear below the button
3. Select "DELETE_MONITOR"
4. Type "DELETE" to confirm
5. Click "DELETE_PERMANENTLY"

**⚠️ Warning:** This action cannot be undone and will delete:
- Monitor configuration
- All heartbeat history
- All statistics and metrics

### Maintenance Mode

#### Enable Maintenance
1. Click the three-dot menu button (⋮) on the monitor row
2. A dropdown menu will appear below the button
3. Select "ENABLE_MAINTENANCE"

**What happens:**
- Monitoring checks are paused
- No new heartbeats created
- Monitor shows maintenance indicator
- Scheduler job removed
- All data preserved

**Use cases:**
- Planned server maintenance
- Deployment windows
- Testing/debugging
- Temporary service interruption

#### Disable Maintenance
1. Click the three-dot menu button (⋮) on the monitor row
2. A dropdown menu will appear below the button
3. Select "RESUME_MONITORING"

**What happens:**
- Monitoring checks resume
- Scheduler job re-added
- Normal operation continues

## Visual Indicators

### Monitor Status Colors
- **Yellow** (`#f2d48a`) - Operational/Live
- **Red** (`#ff6a6a`) - Alert/Down
- **Gray** (`#666666`) - Idle/Pending

### Action Colors
- **Yellow** - Edit/Update actions
- **Red** - Delete action
- **Yellow** (with pause icon) - Maintenance mode

### Maintenance Indicator
When a monitor is in maintenance mode:
- Menu item shows "RESUME_MONITORING" in yellow
- Play icon (▶) displayed
- Monitor continues to appear in list

## Keyboard Shortcuts

### Modals
- **Escape** - Close modal
- **Enter** - Submit form (when focused)
- **Tab** - Navigate between fields

### Actions Menu
- **Click outside** - Close menu
- **Tab** - Navigate menu items
- **Enter** - Select menu item
- **Escape** - Close menu

## Common Workflows

### Temporary Pause
```
1. Enable maintenance mode
2. Perform your work
3. Disable maintenance mode
```

### Update Check Frequency
```
1. Edit monitor
2. Change interval_seconds
3. Save
```

### Rename Monitor
```
1. Edit monitor
2. Change friendly_name
3. Save
```

### Disable Without Deleting
```
1. Edit monitor
2. Uncheck "MONITOR_ACTIVE"
3. Save
```

### Clean Up Old Monitors
```
1. Delete monitor
2. Type "DELETE"
3. Confirm
```

## Error Messages

### Common Errors

**"Failed to update monitor"**
- Check network connection
- Verify you have permission
- Ensure interval is within valid range (30-3600s)

**"Failed to delete monitor"**
- Check network connection
- Verify monitor still exists
- Try refreshing the page

**"Monitor not found"**
- Monitor may have been deleted
- Refresh the page
- Check if you're logged in

**"Invalid monitor ID format"**
- This is a system error
- Try refreshing the page
- Contact support if persists

## Tips & Best Practices

### Naming Conventions
- Use descriptive names: "Production API" not "Monitor 1"
- Include environment: "Staging DB", "Prod Website"
- Be consistent across monitors

### Check Intervals
- **30-60s** - Critical services
- **60-300s** - Standard monitoring
- **300-3600s** - Less critical services
- Consider API rate limits

### Maintenance Mode
- Enable before planned maintenance
- Disable immediately after work complete
- Don't leave in maintenance indefinitely
- Document maintenance windows

### Deletion
- Export data before deleting (if needed)
- Double-check you're deleting the right monitor
- Consider disabling instead of deleting
- Maintenance mode for temporary pauses

### Organization
- Use consistent naming
- Group related monitors
- Regular cleanup of unused monitors
- Document monitor purposes

## Troubleshooting

### Monitor Not Updating
1. Check if monitor is active
2. Verify not in maintenance mode
3. Check interval settings
4. Refresh the page

### Can't Delete Monitor
1. Verify you own the monitor
2. Check network connection
3. Try again after a moment
4. Contact support if persists

### Changes Not Saving
1. Check for validation errors
2. Verify all required fields filled
3. Check network connection
4. Try refreshing and re-attempting

### Actions Menu Not Appearing
1. Click the three-dot button (⋮) on the monitor row
2. Ensure you're logged in
3. Refresh the page
4. Check browser console for errors

## API Reference

For developers integrating with the API:

### Update Monitor
```typescript
PUT /monitors/{monitor_id}
Body: {
  friendly_name?: string,
  interval_seconds?: number,
  is_active?: boolean
}
```

### Delete Monitor
```typescript
DELETE /monitors/{monitor_id}
```

### Enable Maintenance
```typescript
PUT /monitors/{monitor_id}/maintenance
```

### Disable Maintenance
```typescript
DELETE /monitors/{monitor_id}/maintenance
```

## Support

### Getting Help
- Check this guide first
- Review error messages
- Check browser console
- Contact support with:
  - Monitor ID
  - Error message
  - Steps to reproduce

### Reporting Issues
Include:
- What you were trying to do
- What happened instead
- Error messages
- Browser and version
- Screenshots (if applicable)

## Related Documentation
- `MONITOR_CREATION_GUIDE.md` - Creating monitors
- `MONITOR_MANAGEMENT_IMPLEMENTATION.md` - Technical details
- `MONITOR_CREATION_IMPLEMENTATION.md` - Creation feature details
