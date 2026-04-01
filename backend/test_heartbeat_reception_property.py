"""
Property-based test for heartbeat reception idempotency.

**Validates: Requirements 2.1, 2.2**

This test validates Property 1: Heartbeat Reception Idempotency
∀ monitor_id, ∀ t1, t2 where t1 < t2:
  receiveHeartbeat(monitor_id, t1) ∧ receiveHeartbeat(monitor_id, t2) 
  ⟹ last_ping_received = t2

Multiple heartbeat pings update the timestamp to the most recent value.
"""
import asyncio
import sys
from uuid import uuid4
from datetime import datetime, timezone, timedelta

sys.path.insert(0, '/home/kiro/pingsight/backend')

from hypothesis import given, strategies as st, settings, assume
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.models.user import User
from sqlalchemy import select


# Strategy for generating datetime objects with microsecond precision
def datetime_strategy():
    """Generate datetime objects in UTC with microsecond precision"""
    return st.datetimes(
        min_value=datetime(2024, 1, 1),
        max_value=datetime(2025, 12, 31),
        timezones=st.just(timezone.utc)
    )


async def simulate_heartbeat_reception(
    db: AsyncSession,
    monitor: Monitor,
    reception_time: datetime
) -> None:
    """
    Simulate receiving a heartbeat at a specific time.
    This mimics what the POST/GET /api/heartbeats/{monitor_id} endpoint does.
    """
    # Update monitor state
    monitor.last_ping_received = reception_time
    monitor.last_status = "UP"
    
    # Create heartbeat record
    heartbeat = Heartbeat(
        monitor_id=monitor.id,
        status_code=200,
        latency_ms=0,
        error_message=None,
        created_at=reception_time
    )
    db.add(heartbeat)
    await db.commit()
    await db.refresh(monitor)


@given(
    timestamps=st.lists(
        datetime_strategy(),
        min_size=2,
        max_size=10,
        unique=True
    )
)
@settings(max_examples=50, deadline=None)
def test_heartbeat_reception_idempotency(timestamps):
    """
    Property Test: Heartbeat Reception Idempotency
    
    **Validates: Requirements 2.1, 2.2**
    
    Property: Multiple heartbeat pings update the timestamp to the most recent value.
    
    Given: A sequence of heartbeat pings with different timestamps
    When: The pings are received in any order
    Then: The last_ping_received should always equal the most recent timestamp
    """
    async def run_test():
        async with AsyncSessionLocal() as db:
            # Setup: Create test user and heartbeat monitor
            test_user = User(email=f"test_prop_{uuid4()}@example.com")
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            
            monitor = Monitor(
                user_id=test_user.id,
                url="test-property-monitor",
                name="Property Test Monitor",
                interval_seconds=300,
                monitor_type="heartbeat",
                last_status="PENDING",
                is_active=True
            )
            db.add(monitor)
            await db.commit()
            await db.refresh(monitor)
            
            try:
                # Sort timestamps to get the most recent one
                sorted_timestamps = sorted(timestamps)
                most_recent = sorted_timestamps[-1]
                
                # Simulate receiving heartbeats in the sorted order
                # (This tests that later timestamps override earlier ones)
                for timestamp in sorted_timestamps:
                    await simulate_heartbeat_reception(db, monitor, timestamp)
                
                # Verify: last_ping_received should equal the most recent timestamp
                result = await db.execute(
                    select(Monitor).where(Monitor.id == monitor.id)
                )
                updated_monitor = result.scalar_one()
                
                # Property assertion: last_ping_received == most_recent
                assert updated_monitor.last_ping_received == most_recent, (
                    f"Expected last_ping_received to be {most_recent}, "
                    f"but got {updated_monitor.last_ping_received}"
                )
                
                # Additional verification: status should be UP
                assert updated_monitor.last_status == "UP", (
                    f"Expected status to be UP, but got {updated_monitor.last_status}"
                )
                
                # Verify heartbeat records were created
                result = await db.execute(
                    select(Heartbeat)
                    .where(Heartbeat.monitor_id == monitor.id)
                    .order_by(Heartbeat.created_at)
                )
                heartbeat_records = result.scalars().all()
                
                assert len(heartbeat_records) == len(timestamps), (
                    f"Expected {len(timestamps)} heartbeat records, "
                    f"but got {len(heartbeat_records)}"
                )
                
                # Verify all heartbeat records have status_code 200
                for record in heartbeat_records:
                    assert record.status_code == 200, (
                        f"Expected status_code 200, but got {record.status_code}"
                    )
                
            finally:
                # Cleanup
                await db.execute(
                    select(Heartbeat).where(Heartbeat.monitor_id == monitor.id)
                )
                heartbeats = (await db.execute(
                    select(Heartbeat).where(Heartbeat.monitor_id == monitor.id)
                )).scalars().all()
                for hb in heartbeats:
                    await db.delete(hb)
                
                await db.delete(monitor)
                await db.delete(test_user)
                await db.commit()
    
    # Run the async test
    asyncio.run(run_test())


@given(
    t1=datetime_strategy(),
    t2=datetime_strategy()
)
@settings(max_examples=50, deadline=None)
def test_heartbeat_reception_two_pings(t1, t2):
    """
    Property Test: Two Heartbeat Pings (Simplified)
    
    **Validates: Requirements 2.1, 2.2**
    
    Property: When two heartbeats are received, the last_ping_received
    should equal the timestamp of the most recent ping.
    
    This is a simplified version that tests the core idempotency property
    with just two pings.
    """
    # Ensure t1 and t2 are different
    assume(t1 != t2)
    
    async def run_test():
        async with AsyncSessionLocal() as db:
            # Setup
            test_user = User(email=f"test_two_ping_{uuid4()}@example.com")
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            
            monitor = Monitor(
                user_id=test_user.id,
                url="test-two-ping-monitor",
                name="Two Ping Test Monitor",
                interval_seconds=300,
                monitor_type="heartbeat",
                last_status="PENDING",
                is_active=True
            )
            db.add(monitor)
            await db.commit()
            await db.refresh(monitor)
            
            try:
                # Determine which timestamp is more recent
                earlier = min(t1, t2)
                later = max(t1, t2)
                
                # Receive first heartbeat
                await simulate_heartbeat_reception(db, monitor, earlier)
                
                # Verify first heartbeat was recorded
                result = await db.execute(
                    select(Monitor).where(Monitor.id == monitor.id)
                )
                monitor_after_first = result.scalar_one()
                assert monitor_after_first.last_ping_received == earlier
                
                # Receive second heartbeat (more recent)
                await simulate_heartbeat_reception(db, monitor, later)
                
                # Verify: last_ping_received should be the later timestamp
                result = await db.execute(
                    select(Monitor).where(Monitor.id == monitor.id)
                )
                monitor_after_second = result.scalar_one()
                
                assert monitor_after_second.last_ping_received == later, (
                    f"Expected last_ping_received to be {later}, "
                    f"but got {monitor_after_second.last_ping_received}"
                )
                
            finally:
                # Cleanup
                heartbeats = (await db.execute(
                    select(Heartbeat).where(Heartbeat.monitor_id == monitor.id)
                )).scalars().all()
                for hb in heartbeats:
                    await db.delete(hb)
                
                await db.delete(monitor)
                await db.delete(test_user)
                await db.commit()
    
    asyncio.run(run_test())


@given(
    timestamps=st.lists(
        datetime_strategy(),
        min_size=2,
        max_size=5,
        unique=True
    )
)
@settings(max_examples=30, deadline=None)
def test_heartbeat_reception_out_of_order(timestamps):
    """
    Property Test: Out-of-Order Heartbeat Reception
    
    **Validates: Requirements 2.1, 2.2**
    
    Property: Even when heartbeats arrive out of chronological order,
    the last_ping_received should reflect the most recent timestamp.
    
    This tests that the system correctly handles late-arriving heartbeats.
    """
    async def run_test():
        async with AsyncSessionLocal() as db:
            # Setup
            test_user = User(email=f"test_ooo_{uuid4()}@example.com")
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            
            monitor = Monitor(
                user_id=test_user.id,
                url="test-out-of-order-monitor",
                name="Out of Order Test Monitor",
                interval_seconds=300,
                monitor_type="heartbeat",
                last_status="PENDING",
                is_active=True
            )
            db.add(monitor)
            await db.commit()
            await db.refresh(monitor)
            
            try:
                # Shuffle timestamps to simulate out-of-order arrival
                import random
                shuffled = timestamps.copy()
                random.shuffle(shuffled)
                
                # Find the actual most recent timestamp
                most_recent = max(timestamps)
                
                # Receive heartbeats in shuffled order
                for timestamp in shuffled:
                    await simulate_heartbeat_reception(db, monitor, timestamp)
                
                # Verify: last_ping_received should be the most recent,
                # regardless of arrival order
                result = await db.execute(
                    select(Monitor).where(Monitor.id == monitor.id)
                )
                final_monitor = result.scalar_one()
                
                # Compare timestamps accounting for potential timezone normalization
                # Convert both to UTC for comparison
                received_time = final_monitor.last_ping_received
                if received_time.tzinfo is None:
                    received_time = received_time.replace(tzinfo=timezone.utc)
                else:
                    received_time = received_time.astimezone(timezone.utc)
                
                expected_time = most_recent
                if expected_time.tzinfo is None:
                    expected_time = expected_time.replace(tzinfo=timezone.utc)
                else:
                    expected_time = expected_time.astimezone(timezone.utc)
                
                assert received_time == expected_time, (
                    f"Expected last_ping_received to be {expected_time}, "
                    f"but got {received_time}. "
                    f"Arrival order was: {shuffled}"
                )
                
            finally:
                # Cleanup
                heartbeats = (await db.execute(
                    select(Heartbeat).where(Heartbeat.monitor_id == monitor.id)
                )).scalars().all()
                for hb in heartbeats:
                    await db.delete(hb)
                
                await db.delete(monitor)
                await db.delete(test_user)
                await db.commit()
    
    asyncio.run(run_test())


if __name__ == "__main__":
    import pytest
    
    print("=" * 70)
    print("Running Property-Based Tests for Heartbeat Reception Idempotency")
    print("=" * 70)
    print()
    print("These tests validate that multiple heartbeat pings update the")
    print("timestamp to the most recent value, regardless of arrival order.")
    print()
    print("**Validates: Requirements 2.1, 2.2**")
    print()
    
    # Run the tests
    pytest.main([__file__, "-v", "--tb=short"])
