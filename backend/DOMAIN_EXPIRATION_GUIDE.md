# Domain Expiration Checking - "The WHOIS Check"

## Overview

Domain expiration checking is a critical monitoring feature that alerts you before your domain registration expires. This is different from SSL certificate checking:

- **SSL Certificate**: The "security badge" - ensures encrypted connections
- **Domain Expiration**: The "lease on the land" - ensures you own the domain name

If a domain expires, the entire website vanishes and someone else can register it.

## Implementation Details

### Database Schema

Three new fields added to the `monitors` table:

```sql
domain_expiry_date      TIMESTAMP WITH TIME ZONE  -- When the domain expires
domain_days_remaining   INTEGER                   -- Days until expiration
domain_last_checked     TIMESTAMP WITH TIME ZONE  -- Last WHOIS check time
```

### Check Frequency: CRITICAL

**WHOIS checks run ONCE EVERY 24 HOURS per domain.**

Why? WHOIS servers implement aggressive rate limiting. If you query too frequently:
- Your IP address will be blocked
- You'll receive incomplete or error responses
- The registrar may flag your activity as abusive

The `should_check_domain()` function enforces this 24-hour interval.

### Status Levels

Domain status is calculated based on days remaining:

| Days Remaining | Status | Meaning |
|---------------|--------|---------|
| < 0 | `EXPIRED` | Domain has expired - CRITICAL |
| 0-7 | `CRITICAL` | Less than 1 week - Urgent action needed |
| 8-30 | `WARNING` | Less than 1 month - Renewal recommended |
| 31+ | `VALID` | Domain is valid |

### WHOIS Library

Uses `python-whois` library to query the global WHOIS database:

```python
import whois

w = whois.whois("example.com")
expiry_date = w.expiration_date
```

### Edge Cases Handled

1. **Multiple Expiry Dates**: Some WHOIS responses return a list of dates
   - Solution: Take the first date (usually most relevant)

2. **Missing Expiry Date**: Some domains don't expose expiry info
   - Solution: Return None, log warning

3. **Timezone Issues**: WHOIS dates may lack timezone info
   - Solution: Assume UTC if not specified

4. **Rate Limiting**: WHOIS servers block excessive queries
   - Solution: 24-hour check interval enforced

## Code Flow

### 1. Domain Checker Module (`domain_checker.py`)

```python
def get_domain_expiry(url: str) -> Optional[Dict[str, Any]]:
    """
    Query WHOIS for domain expiration.
    Returns: {expiry_date, days_remaining, status, hostname}
    """
    
def should_check_domain(last_checked: Optional[datetime]) -> bool:
    """
    Check if 24 hours have passed since last check.
    """
```

### 2. Integration in Worker (`engine.py`)

```python
async def perform_check(monitor_id, url, db):
    # ... existing SSL check ...
    
    # Domain check - ONCE EVERY 24 HOURS
    domain_info = None
    if should_check_domain(monitor.domain_last_checked):
        domain_info = await asyncio.to_thread(get_domain_expiry, url)
        
        if domain_info:
            # Update monitor with domain info
            update_values.update({
                "domain_expiry_date": domain_info["expiry_date"],
                "domain_days_remaining": domain_info["days_remaining"],
                "domain_last_checked": check_time
            })
```

### 3. API Response (`schemas.py`)

Domain fields included in `MonitorResponse`:

```python
class MonitorResponse(BaseModel):
    # ... existing fields ...
    
    # Domain Expiration fields
    domain_expiry_date: Optional[datetime] = None
    domain_days_remaining: Optional[int] = None
    domain_last_checked: Optional[datetime] = None
```

## Testing

### Manual Test

```bash
# Create a monitor
curl -X POST http://localhost:8000/monitors/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com",
    "friendly_name": "Google Domain Test",
    "interval_seconds": 60
  }'

# Wait for first check (domain check runs on first check)
# Check monitor details
curl http://localhost:8000/monitors/{monitor_id}
```

Expected response includes:
```json
{
  "domain_expiry_date": "2028-09-14T04:00:00Z",
  "domain_days_remaining": 912,
  "domain_last_checked": "2026-04-01T10:30:00Z"
}
```

### Verify 24-Hour Interval

1. Check logs for first domain check:
   ```
   [WHOIS] Starting domain expiration check for https://google.com (24h interval)
   [WHOIS] ✓ Domain check successful: VALID, 912 days remaining
   ```

2. Subsequent checks within 24 hours should skip:
   ```
   [WHOIS] Skipping domain check for https://google.com (checked within last 24 hours)
   ```

3. After 24 hours, check runs again

## Monitoring Dashboard Integration

Frontend should display domain status with appropriate urgency:

```javascript
// Example status display logic
function getDomainStatusColor(days_remaining) {
  if (days_remaining < 0) return 'red';      // EXPIRED
  if (days_remaining <= 7) return 'red';     // CRITICAL
  if (days_remaining <= 30) return 'orange'; // WARNING
  return 'green';                            // VALID
}
```

## Best Practices

1. **Never bypass the 24-hour interval** - Rate limiting is real
2. **Log all WHOIS queries** - Helps debug rate limiting issues
3. **Handle None gracefully** - Not all domains expose expiry info
4. **Alert on CRITICAL status** - Less than 7 days is urgent
5. **Provide renewal links** - Help users take action quickly

## Comparison: SSL vs Domain

| Feature | SSL Certificate | Domain Expiration |
|---------|----------------|-------------------|
| What it protects | Connection security | Domain ownership |
| Check frequency | Every check (30-60s) | Once per 24 hours |
| Typical duration | 90 days (Let's Encrypt) | 1-10 years |
| Renewal process | Automated (certbot) | Manual (registrar) |
| Failure impact | Browser warnings | Site disappears |
| Rate limiting | None | Aggressive |

## Migration

Migration `70bed68128ac` adds the three domain fields:

```python
def upgrade() -> None:
    op.add_column('monitors', sa.Column('domain_expiry_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('monitors', sa.Column('domain_days_remaining', sa.Integer(), nullable=True))
    op.add_column('monitors', sa.Column('domain_last_checked', sa.DateTime(timezone=True), nullable=True))
```

Run with:
```bash
uv run alembic upgrade head
```

## Future Enhancements

1. **Auto-renewal reminders**: Email alerts at 30, 14, 7 days
2. **Registrar integration**: Direct renewal links for common registrars
3. **Historical tracking**: Track domain expiry date changes over time
4. **Bulk domain checks**: Check multiple domains efficiently
5. **WHOIS caching**: Cache results for 24 hours to reduce queries

## Troubleshooting

### "WHOIS lookup failed"

**Cause**: Rate limiting, invalid domain, or WHOIS server down

**Solution**: 
- Check if domain is valid
- Verify 24-hour interval is enforced
- Try manual WHOIS query: `whois example.com`

### "No expiration date found"

**Cause**: Some TLDs don't expose expiry info in WHOIS

**Solution**: This is expected for certain domains (e.g., some ccTLDs)

### "Multiple expiry dates found"

**Cause**: WHOIS returns list of dates (common for some registrars)

**Solution**: Code automatically takes first date - this is normal

## Summary

Domain expiration checking is now fully integrated into PingSight:

✅ Database schema updated with domain fields  
✅ WHOIS checker module created with rate limiting  
✅ 24-hour check interval enforced  
✅ Integration in worker for both simple and scenario monitors  
✅ API responses include domain status  
✅ Comprehensive error handling and logging  

The system will now alert you before domains expire, preventing catastrophic site outages.
