# Critical Bug Fixed: Transaction Error in Maintenance Mode

## The Bug
When maintenance mode was enabled and then auto-resumed, the worker crashed with:
```
sqlalchemy.exc.InternalError: current transaction is aborted, 
commands ignored until end of transaction block
```

## Why It Happened
The `perform_check()` function was committing the database transaction TWICE:
1. First commit: When auto-resuming from maintenance (clearing maintenance flags)
2. Second commit: When saving the heartbeat

This violated SQLAlchemy's transaction model. If anything failed between the two commits, the transaction would be in a broken state.

## The Fix
Changed to a **single-commit pattern**:
- Auto-resume updates the monitor object in memory only
- Track that auto-resume occurred with `auto_resumed` flag
- Include maintenance field updates in the final UPDATE statement
- Commit everything together at the end (one transaction)

## Files Changed
- `backend/app/worker/engine.py` - Fixed `perform_check()` function

## How to Test
1. Enable maintenance mode for 1 minute on any monitor
2. Wait 70 seconds for auto-resume to trigger
3. Check worker logs - should see successful commits, no transaction errors

Or run: `./test_maintenance_fix.sh`

## Status
✅ Fixed - Ready for testing
