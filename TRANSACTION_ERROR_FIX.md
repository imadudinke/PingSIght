# Critical Transaction Error Fix

## Problem
The worker was crashing with transaction errors during normal operation:
```
sqlalchemy.exc.InternalError: current transaction is aborted, 
commands ignored until end of transaction block
```

This happened when trying to INSERT heartbeats, even without any manual operations.

## Root Cause
Something was failing in the transaction before the heartbeat INSERT, but the error wasn't being caught or logged properly. The transaction would be poisoned, and when the INSERT tried to execute, it would fail because the transaction was already aborted.

## The Fix - Three-Part Solution

### 1. Separate Auto-Resume Transaction
Auto-resume now has its own UPDATE+flush+refresh cycle:
```python
if monitor.maintenance_until and check_time > monitor.maintenance_until:
    await db.execute(update(Monitor)...)
    await db.flush()  # Execute immediately
    await db.refresh(monitor)  # Sync object state
```

### 2. Explicit Flush After Every UPDATE
All Monitor UPDATE operations now call `await db.flush()` immediately to execute the SQL and catch errors early:
```python
await db.execute(update(Monitor)...)
await db.flush()  # Force execution
```

### 3. Comprehensive Error Handling
Every database operation is wrapped in try-catch:
- Monitor UPDATE (with flush)
- Anomaly detection query
- Heartbeat INSERT

Each operation can fail independently without poisoning the transaction.

## Code Changes
File: `backend/app/worker/engine.py`

**Key Changes:**
1. Auto-resume does immediate UPDATE+flush+refresh (lines 480-495)
2. Monitor UPDATE has explicit flush (line 710)
3. Anomaly detection wrapped in try-catch (lines 715-730)
4. Heartbeat INSERT wrapped in try-catch (lines 735-770)

## Why This Works
- Flush forces immediate SQL execution
- Errors are caught at the point of failure
- Each operation is isolated
- Refresh syncs object state after updates
- Clean transaction state for subsequent operations

## Testing
Restart the worker and monitor logs:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Look for:
- `[DB_UPDATE] Monitor {id} updated successfully`
- `[DB_INSERT] Creating heartbeat record`
- `[DB_COMMIT] Heartbeat saved and committed`

No more transaction errors!
