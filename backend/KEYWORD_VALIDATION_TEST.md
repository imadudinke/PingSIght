# Testing Keyword Validation - Step by Step

## The Fix Applied

**Problem:** The `create_monitor` endpoint was not saving the `required_keyword` field to the database.

**Solution:** Updated line 67 in `backend/app/api/monitors.py` to include `required_keyword`:

```python
steps_data = [
    {
        "name": step.name,
        "url": str(step.url),
        "order": step.order,
        "required_keyword": step.required_keyword  # ← ADDED THIS
    }
    for step in monitor_in.steps
]
```

---

## How to Test

### Step 1: Restart the Backend Server

The code changes won't take effect until you restart:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Create a Test Monitor with Keywords

**Request:**
```bash
POST http://localhost:8000/api/monitors
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "url": "https://example.com",
  "friendly_name": "Keyword Validation Test",
  "interval_seconds": 60,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "order": 1,
      "required_keyword": "Example Domain"
    }
  ]
}
```

**Expected Response:**
```json
{
  "id": "some-uuid",
  "monitor_type": "scenario",
  "steps": [
    {
      "url": "https://example.com",
      "name": "Homepage",
      "order": 1
      // Note: required_keyword won't show in the monitor response,
      // but it's saved in the database
    }
  ]
}
```

### Step 3: Wait for the Check to Run

The monitor will check after 60 seconds. You can watch the logs:

```bash
tail -f logs/app.log
```

Look for:
```
[SCENARIO_CHECK] Starting scenario check with 1 steps
[SCENARIO_CHECK] Checking step 1: Homepage - https://example.com
[KEYWORD_CHECK] Checking for keyword 'Example Domain' in step 1
[KEYWORD_CHECK] ✓ Keyword 'Example Domain' found in step 1
[SCENARIO_CHECK] Step 1 result: UP, 200, 500ms
```

### Step 4: Retrieve the Monitor Results

**Request:**
```bash
GET http://localhost:8000/api/monitors/{monitor_id}
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "recent_heartbeats": [
    {
      "step_results": [
        {
          "name": "Homepage",
          "url": "https://example.com",
          "status": "UP",
          "status_code": 200,
          "latency_ms": 500,
          "required_keyword": "Example Domain",
          "keyword_found": true,
          "error": null
        }
      ]
    }
  ]
}
```

---

## Test Cases

### Test Case 1: Keyword Found (Success)

**Monitor:**
```json
{
  "url": "https://example.com",
  "friendly_name": "Test Success",
  "interval_seconds": 60,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "order": 1,
      "required_keyword": "Example Domain"
    }
  ]
}
```

**Expected Result:**
- `"status": "UP"`
- `"required_keyword": "Example Domain"`
- `"keyword_found": true`
- `"error": null`

---

### Test Case 2: Keyword Not Found (Failure)

**Monitor:**
```json
{
  "url": "https://example.com",
  "friendly_name": "Test Failure",
  "interval_seconds": 60,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Homepage",
      "url": "https://example.com",
      "order": 1,
      "required_keyword": "ThisKeywordDoesNotExist"
    }
  ]
}
```

**Expected Result:**
- `"status": "DOWN"`
- `"required_keyword": "ThisKeywordDoesNotExist"`
- `"keyword_found": false`
- `"error": "Keyword 'ThisKeywordDoesNotExist' not found in page content"`

---

### Test Case 3: Short-Circuit (First Step Fails)

**Monitor:**
```json
{
  "url": "https://example.com",
  "friendly_name": "Test Short Circuit",
  "interval_seconds": 60,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Step 1",
      "url": "https://example.com",
      "order": 1,
      "required_keyword": "KeywordThatDoesNotExist"
    },
    {
      "name": "Step 2",
      "url": "https://example.com",
      "order": 2,
      "required_keyword": "Example Domain"
    },
    {
      "name": "Step 3",
      "url": "https://example.com",
      "order": 3,
      "required_keyword": "Example Domain"
    }
  ]
}
```

**Expected Result:**
- Only 1 step in `step_results` (Step 1)
- Step 1: `"status": "DOWN"`, `"keyword_found": false`
- Steps 2 and 3: SKIPPED (not in results)
- Overall status: `"DOWN"`
- `"failed_step": "Step 1"`
- `"failure_reason": "Required keyword 'KeywordThatDoesNotExist' missing from page"`

**Logs:**
```
[KEYWORD_CHECK] ✗ Keyword 'KeywordThatDoesNotExist' NOT FOUND in step 1
[SCENARIO_CHECK] Short-circuiting: Step 1 failed, skipping remaining steps
```

---

### Test Case 4: Real-World Example (Smile Dental Clinic)

**Monitor:**
```json
{
  "url": "https://smilespecialtydentalclinic.com/",
  "friendly_name": "Smile Dental with Keywords",
  "interval_seconds": 60,
  "monitor_type": "scenario",
  "steps": [
    {
      "name": "Services Page",
      "url": "https://smilespecialtydentalclinic.com/services/",
      "order": 1,
      "required_keyword": "Services"
    },
    {
      "name": "News Page",
      "url": "https://smilespecialtydentalclinic.com/news/",
      "order": 2,
      "required_keyword": "News"
    }
  ]
}
```

**Expected Result:**
- Both steps: `"status": "UP"`
- Step 1: `"required_keyword": "Services"`, `"keyword_found": true`
- Step 2: `"required_keyword": "News"`, `"keyword_found": true`

---

## Troubleshooting

### Issue: `required_keyword` is still null

**Possible Causes:**
1. Server not restarted after code change
2. Old monitor created before the fix
3. Request doesn't include `required_keyword` field

**Solutions:**
1. Restart the backend server
2. Create a NEW monitor (delete old one first)
3. Double-check your JSON request includes `"required_keyword": "..."`

### Issue: Keyword validation not running

**Check the logs:**
```bash
grep "KEYWORD_CHECK" logs/app.log
```

If you don't see any `[KEYWORD_CHECK]` logs, the keyword field isn't being saved.

### Issue: All keywords showing as "not found"

**Possible Causes:**
1. Typo in keyword
2. Content is JavaScript-rendered (not in initial HTML)
3. Keyword is in iframe or shadow DOM

**Solutions:**
1. View page source (Ctrl+U) and search for the keyword
2. Use a keyword from the static HTML
3. Try a more generic keyword like the site name

---

## Verification Checklist

Before testing, verify:

- [ ] Backend server restarted after code change
- [ ] Request includes `"required_keyword"` field in steps
- [ ] Monitor is `"monitor_type": "scenario"` (not "simple")
- [ ] Waited at least `interval_seconds` for first check
- [ ] Checking the correct monitor ID in GET request

---

## Quick Copy-Paste Test

**1. Create Monitor:**
```bash
curl -X POST http://localhost:8000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "friendly_name": "Quick Test",
    "interval_seconds": 60,
    "monitor_type": "scenario",
    "steps": [
      {
        "name": "Homepage",
        "url": "https://example.com",
        "order": 1,
        "required_keyword": "Example Domain"
      }
    ]
  }'
```

**2. Wait 60 seconds**

**3. Get Results:**
```bash
curl http://localhost:8000/api/monitors/{MONITOR_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Look for:**
```json
"required_keyword": "Example Domain",
"keyword_found": true
```

If you see this, keyword validation is working! 🎉

---

## Summary

The fix is complete. After restarting the server and creating a NEW monitor with `required_keyword` fields, you should see:

✓ Keywords saved to database
✓ Keyword validation runs during checks
✓ Results show `required_keyword` and `keyword_found` fields
✓ Short-circuit works when keywords not found
✓ Detailed error messages when validation fails

Test it now and let me know the results!
