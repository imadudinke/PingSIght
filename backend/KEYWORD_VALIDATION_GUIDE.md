# Keyword Validation - Content-Based Monitoring

## Overview
Keyword validation moves beyond simple status code checking to verify that the actual page content is correct. This is critical for detecting "soft failures" where the server returns 200 OK but displays an error message.

---

## The Problem: Status Code Isn't Enough

### Scenario 1: Database Connection Failure
```
Server Response: 200 OK
Page Content: "Error: Could not connect to database"
Traditional Monitor: ✓ UP (sees 200 status)
With Keyword Check: ✗ DOWN (missing expected content)
```

### Scenario 2: Login Page Instead of Dashboard
```
Server Response: 200 OK
Page Content: Login form (user session expired)
Traditional Monitor: ✓ UP (sees 200 status)
With Keyword Check: ✗ DOWN (expected "Dashboard" not found)
```

### Scenario 3: Maintenance Mode
```
Server Response: 200 OK
Page Content: "Site under maintenance"
Traditional Monitor: ✓ UP (sees 200 status)
With Keyword Check: ✗ DOWN (expected content missing)
```

---

## How It Works

### 1. Positive Assertion
Instead of assuming 200 = success, you explicitly define what success looks like:

```json
{
  "name": "Login",
  "url": "https://example.com/login",
  "order": 1,
  "required_keyword": "Welcome"
}
```

**Logic:**
- If status code is 200 AND "Welcome" appears on page → UP
- If status code is 200 BUT "Welcome" is missing → DOWN
- If status code is 500 → DOWN (regardless of content)

### 2. Case-Insensitive Search
The engine converts both the keyword and page content to lowercase before comparing:

```python
if required_keyword.lower() not in page_content.lower():
    # Keyword not found - mark as DOWN
```

**Examples:**
- User types: `"Dashboard"`
- Matches: "dashboard", "DASHBOARD", "DashBoard", "Your Dashboard"
- Doesn't match: "Dash board", "Dashbord" (typo)

### 3. Short-Circuit Optimization
When a step fails (including keyword validation), the engine stops immediately:

```
Step 1: Login → Keyword "Welcome" not found → STOP
Step 2: Dashboard → SKIPPED (no point checking if login failed)
Step 3: Profile → SKIPPED
```

**Benefits:**
- Faster failure detection
- Reduced server load
- Clearer error reporting (know exactly where it failed)

---

## Implementation Details

### Database Schema
The `required_keyword` field is stored in the `steps` JSONB column:

```json
{
  "steps": [
    {
      "name": "Login",
      "url": "https://example.com/login",
      "order": 1,
      "required_keyword": "Welcome"
    },
    {
      "name": "Dashboard",
      "url": "https://example.com/dashboard",
      "order": 2,
      "required_keyword": "Dashboard"
    }
  ]
}
```

### API Schema
**File: `backend/app/schemas/monitor.py`**

```python
class ScenarioStep(BaseModel):
    name: str
    url: HttpUrl
    order: int
    required_keyword: Optional[str] = None  # New field
```

### Engine Logic
**File: `backend/app/worker/engine.py`**

```python
# After successful HTTP request
if required_keyword and response.is_success:
    page_content = response.text
    
    # Case-insensitive search
    if required_keyword.lower() not in page_content.lower():
        step_status = "DOWN"
        step_error = f"Keyword '{required_keyword}' not found in page content"
        
        # Short-circuit: stop checking remaining steps
        break
```

---

## Step-by-Step Flow

### Without Keyword Validation
```
1. Request https://example.com/login
2. Receive 200 OK
3. Mark as UP ✓
4. Continue to next step
```

### With Keyword Validation
```
1. Request https://example.com/login
2. Receive 200 OK
3. Read page content (response.text)
4. Search for "Welcome" (case-insensitive)
5. If found:
   - Mark as UP ✓
   - Continue to next step
6. If NOT found:
   - Mark as DOWN ✗
   - Record error: "Keyword 'Welcome' not found"
   - STOP (short-circuit remaining steps)
```

---

## Step Results Format

### Success Case
```json
{
  "name": "Login",
  "url": "https://example.com/login",
  "order": 1,
  "status": "UP",
  "status_code": 200,
  "latency_ms": 1500,
  "dns_ms": 0,
  "tcp_ms": 20,
  "tls_ms": 35,
  "ttfb_ms": 1.5,
  "error": null,
  "required_keyword": "Welcome",
  "keyword_found": true,
  "checked_at": "2026-03-31T21:33:39Z"
}
```

### Keyword Not Found
```json
{
  "name": "Login",
  "url": "https://example.com/login",
  "order": 1,
  "status": "DOWN",
  "status_code": 200,
  "latency_ms": 1500,
  "dns_ms": 0,
  "tcp_ms": 20,
  "tls_ms": 35,
  "ttfb_ms": 1.5,
  "error": "Keyword 'Welcome' not found in page content",
  "required_keyword": "Welcome",
  "keyword_found": false,
  "checked_at": "2026-03-31T21:33:39Z"
}
```

---

## Usage Examples

### Example 1: E-commerce Checkout Flow
```json
{
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Product Page",
      "url": "https://shop.example.com/product/123",
      "order": 1,
      "required_keyword": "Add to Cart"
    },
    {
      "name": "Shopping Cart",
      "url": "https://shop.example.com/cart",
      "order": 2,
      "required_keyword": "Proceed to Checkout"
    },
    {
      "name": "Checkout",
      "url": "https://shop.example.com/checkout",
      "order": 3,
      "required_keyword": "Payment Method"
    }
  ]
}
```

### Example 2: User Authentication Flow
```json
{
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Login Page",
      "url": "https://app.example.com/login",
      "order": 1,
      "required_keyword": "Sign In"
    },
    {
      "name": "Dashboard",
      "url": "https://app.example.com/dashboard",
      "order": 2,
      "required_keyword": "Welcome back"
    },
    {
      "name": "Profile",
      "url": "https://app.example.com/profile",
      "order": 3,
      "required_keyword": "Account Settings"
    }
  ]
}
```

### Example 3: API Health Check
```json
{
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "API Status",
      "url": "https://api.example.com/health",
      "order": 1,
      "required_keyword": "\"status\":\"healthy\""
    },
    {
      "name": "Database Check",
      "url": "https://api.example.com/health/database",
      "order": 2,
      "required_keyword": "\"connected\":true"
    }
  ]
}
```

---

## Best Practices

### 1. Choose Unique Keywords
❌ Bad: "Error" (too generic, might appear in help text)
✓ Good: "Dashboard" (specific to the page you expect)

### 2. Use Short, Distinctive Keywords
❌ Bad: "Welcome to our amazing dashboard where you can manage everything"
✓ Good: "Dashboard"

### 3. Consider Case Variations
The engine handles this automatically, but be aware:
- "Login" matches "login", "LOGIN", "Login"
- No need to worry about capitalization

### 4. Test Your Keywords
Before deploying, manually check that:
- The keyword appears on the success page
- The keyword does NOT appear on error pages
- The keyword is unique enough to avoid false positives

### 5. Use JSON for API Responses
For JSON APIs, include the quotes:
- `"status":"ok"` (includes quotes)
- Not just `ok` (might match in other contexts)

---

## Logging

The engine provides detailed logs for keyword validation:

### Success
```
[KEYWORD_CHECK] Checking for keyword 'Welcome' in step 1
[KEYWORD_CHECK] ✓ Keyword 'Welcome' found in step 1
```

### Failure
```
[KEYWORD_CHECK] Checking for keyword 'Dashboard' in step 2
[KEYWORD_CHECK] ✗ Keyword 'Dashboard' NOT FOUND in step 2
[SCENARIO_CHECK] Short-circuiting: Step 2 failed, skipping remaining steps
```

### Error
```
[KEYWORD_CHECK] Error reading page content: UnicodeDecodeError
```

---

## Performance Considerations

### Content Size
- The engine reads the entire response body (`response.text`)
- For large pages (>1MB), this adds minimal overhead (~10-50ms)
- The search operation is O(n) but very fast in Python

### Memory Usage
- Each step's content is read into memory temporarily
- Content is discarded after keyword check
- No persistent storage of page content

### Network Impact
- No additional requests (uses existing response)
- No impact on timing metrics (DNS, TCP, TLS, TTFB)

---

## Comparison with Competitors

### Uptime Robot
- Only checks status codes
- No content validation
- Can't detect soft failures

### PingSight (with Keyword Validation)
- Checks status codes AND content
- Detects soft failures (200 OK with error message)
- Short-circuits on failure for faster detection
- Case-insensitive matching
- Detailed error reporting

---

## Migration Guide

### Existing Monitors
Existing scenario monitors without `required_keyword` continue to work normally:
- Only status code is checked
- No breaking changes

### Adding Keyword Validation
To add keyword validation to existing monitors:

1. Update the monitor via API:
```json
PATCH /api/monitors/{id}
{
  "steps": [
    {
      "name": "Login",
      "url": "https://example.com/login",
      "order": 1,
      "required_keyword": "Welcome"  // Add this field
    }
  ]
}
```

2. The next check will use keyword validation

---

## Troubleshooting

### Keyword Not Found (False Negative)
**Problem:** Keyword exists on page but marked as not found

**Possible Causes:**
1. JavaScript-rendered content (page loads via JS after initial HTML)
2. Typo in keyword
3. Content is in iframe or shadow DOM
4. Content is dynamically loaded

**Solutions:**
- Use a keyword from the initial HTML (not JS-rendered)
- Check the actual page source (View Source in browser)
- Use a more generic keyword that appears in static HTML

### False Positives
**Problem:** Keyword found but page is actually broken

**Possible Causes:**
1. Keyword too generic (e.g., "Error" appears in help text)
2. Keyword appears in navigation/footer on all pages

**Solutions:**
- Choose a more specific keyword unique to the success state
- Use a longer phrase or include surrounding context

---

## Future Enhancements

Potential improvements for keyword validation:

1. **Multiple Keywords (AND logic)**
   - Require multiple keywords to all be present
   - Example: "Welcome" AND "Dashboard"

2. **Negative Keywords (NOT logic)**
   - Fail if certain keywords appear
   - Example: NOT "Error" AND NOT "Maintenance"

3. **Regex Support**
   - More flexible pattern matching
   - Example: `"balance.*\$[0-9]+"`

4. **JSON Path Validation**
   - For API responses
   - Example: `$.status == "healthy"`

5. **Response Time Threshold**
   - Fail if keyword found but response too slow
   - Example: Keyword found but took >5 seconds

---

This feature makes PingSight significantly more powerful than traditional uptime monitors by detecting real user-facing issues, not just server availability!
