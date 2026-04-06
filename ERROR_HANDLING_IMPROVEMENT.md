# Error Handling Improvement - Detailed Validation Errors

## Problem
When creating or editing monitors, backend validation errors were not being displayed properly. Users only saw generic messages like "Failed to create monitor" instead of specific validation errors.

**Example Backend Error:**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "url"],
      "msg": "Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1",
      "input": "http://127.0.0.1:8000/docs",
      "ctx": {"error": {}}
    },
    {
      "type": "literal_error",
      "loc": ["body", "monitor_type"],
      "msg": "Input should be 'simple' or 'scenario'",
      "input": "Vercel",
      "ctx": {"expected": "'simple' or 'scenario'"}
    }
  ]
}
```

**What User Saw:**
```
ERROR: Failed to create monitor
```

## Solution
Enhanced error handling to parse FastAPI validation errors and display them in a user-friendly format.

### Changes Made

#### 1. CreateMonitorModal (`frontend/components/monitors/CreateMonitorModal.tsx`)

**Before:**
```typescript
if (response.response.ok) {
  onSuccess();
  handleClose();
} else {
  setError("Failed to create monitor");
}
```

**After:**
```typescript
if (response.error) {
  // Parse validation errors
  const errorData = response.error as any;
  if (errorData.detail && Array.isArray(errorData.detail)) {
    const errorMessages = errorData.detail.map((err: any) => {
      const field = err.loc?.slice(1).join('.') || 'unknown';
      return `${field.toUpperCase()}: ${err.msg}`;
    }).join('\n');
    setError(errorMessages);
  } else {
    setError(errorData.detail || "Failed to create monitor");
  }
} else {
  onSuccess();
  handleClose();
}
```

**Error Display Enhancement:**
```tsx
{error && (
  <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3">
    <div className="flex items-start gap-2">
      <svg className="w-4 h-4 text-[#ff6a6a] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1">
        <div className="text-[#ff6a6a] text-[10px] tracking-wider uppercase font-mono font-bold mb-1">
          VALIDATION_ERROR
        </div>
        <div className="text-[#ff6a6a] text-[10px] font-mono leading-relaxed whitespace-pre-line">
          {error}
        </div>
      </div>
    </div>
  </div>
)}
```

#### 2. EditMonitorModal (`frontend/components/monitors/EditMonitorModal.tsx`)

Applied the same error parsing logic and enhanced error display.

## What Users See Now

### Example 1: Invalid URL
**Backend Error:**
```json
{
  "detail": [{
    "loc": ["body", "url"],
    "msg": "Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1"
  }]
}
```

**User Sees:**
```
VALIDATION_ERROR
URL: Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1
```

### Example 2: Multiple Validation Errors
**Backend Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "url"],
      "msg": "Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1"
    },
    {
      "loc": ["body", "monitor_type"],
      "msg": "Input should be 'simple' or 'scenario'"
    }
  ]
}
```

**User Sees:**
```
VALIDATION_ERROR
URL: Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1
MONITOR_TYPE: Input should be 'simple' or 'scenario'
```

### Example 3: Interval Too Low
**Backend Error:**
```json
{
  "detail": [{
    "loc": ["body", "interval_seconds"],
    "msg": "Input should be greater than or equal to 60"
  }]
}
```

**User Sees:**
```
VALIDATION_ERROR
INTERVAL_SECONDS: Input should be greater than or equal to 60
```

## Error Parsing Logic

### Field Name Extraction:
```typescript
const field = err.loc?.slice(1).join('.') || 'unknown';
```
- `err.loc` is an array like `["body", "url"]` or `["body", "steps", "0", "url"]`
- We skip the first element ("body") and join the rest with dots
- Examples:
  - `["body", "url"]` → `"url"`
  - `["body", "steps", "0", "url"]` → `"steps.0.url"`
  - `["body", "monitor_type"]` → `"monitor_type"`

### Message Formatting:
```typescript
return `${field.toUpperCase()}: ${err.msg}`;
```
- Converts field name to uppercase for consistency
- Combines with the error message
- Example: `"URL: Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1"`

### Multiple Errors:
```typescript
.join('\n');
```
- Joins multiple errors with newlines
- Displayed using `whitespace-pre-line` CSS to preserve line breaks

## Visual Improvements

### Before:
- Plain red text
- Generic error message
- No icon
- No structure

### After:
- Warning icon (⚠️)
- "VALIDATION_ERROR" header
- Structured layout with proper spacing
- Multi-line support for multiple errors
- Monospace font for technical details
- Proper color scheme (red background with red text)

## Benefits

### For Users:
1. **Clear feedback** - Know exactly what's wrong
2. **Actionable** - Can fix the specific issue
3. **Professional** - Looks polished and intentional
4. **Multiple errors** - See all validation issues at once

### For Developers:
1. **Consistent** - Same error handling across all modals
2. **Maintainable** - Easy to update error display
3. **Extensible** - Can add more error types easily
4. **Debuggable** - Console.error logs full error for debugging

## Error Types Handled

1. **Validation Errors** - FastAPI Pydantic validation
2. **Value Errors** - Custom validation (e.g., private URLs)
3. **Type Errors** - Wrong data types
4. **Literal Errors** - Invalid enum values
5. **Generic Errors** - Fallback for unexpected errors

## Testing Scenarios

### Test 1: Private URL
```
URL: http://127.0.0.1:8000
Expected: "URL: Value error, Monitoring internal/private URLs is not allowed: 127.0.0.1"
```

### Test 2: Invalid Monitor Type
```
Monitor Type: (manually set to invalid value)
Expected: "MONITOR_TYPE: Input should be 'simple' or 'scenario'"
```

### Test 3: Interval Too Low
```
Interval: 10 seconds (for heartbeat)
Expected: "INTERVAL_SECONDS: Input should be greater than or equal to 60"
```

### Test 4: Missing Required Field
```
Friendly Name: (empty)
Expected: "FRIENDLY_NAME: Field required"
```

### Test 5: Invalid URL Format
```
URL: "not-a-url"
Expected: "URL: Input should be a valid URL"
```

## Future Enhancements

1. **Field Highlighting**: Highlight the specific input field with the error
2. **Inline Errors**: Show errors directly below each field
3. **Error Icons**: Different icons for different error types
4. **Translations**: Support for multiple languages
5. **Error Codes**: Add error codes for documentation reference
6. **Suggestions**: Provide suggestions for common errors (e.g., "Did you mean https://...?")
