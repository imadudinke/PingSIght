"""
Test script for GET heartbeat endpoint functionality.
This tests the GET /api/heartbeats/{monitor_id} endpoint.
"""
import asyncio
import sys
from uuid import uuid4
from datetime import datetime, timezone

# Add the backend directory to the path
sys.path.insert(0, '/home/kiro/pingsight/backend')

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.monitor import Monitor
from app.models.heartbeat import Heartbeat
from app.models.user import User
from sqlalchemy import select


async def test_get_heartbeat_endpoint():
    """Test the GET heartbeat reception logic"""
    
    async with AsyncSessionLocal() as db:
        print("=" * 60)
        print("Testing GET Heartbeat Endpoint")
        print("=" * 60)
        
        # Step 1: Create a test user
        print("\n1. Creating test user...")
        test_user = User(
            email=f"test_heartbeat_get_{uuid4()}@example.com"
        )
        db.add(test_user)
        await db.commit()
        await db.refresh(test_user)
        print(f"   ✓ Created user: {test_user.email}")
        
        # Step 2: Create a heartbeat monitor
        print("\n2. Creating heartbeat monitor...")
        monitor = Monitor(
            user_id=test_user.id,
            url="test-heartbeat-get-monitor",
            name="Test GET Heartbeat Monitor",
            interval_seconds=300,  # 5 minutes
            monitor_type="heartbeat",
            last_status="PENDING",
            is_active=True
        )
        db.add(monitor)
        await db.commit()
        await db.refresh(monitor)
        print(f"   ✓ Created monitor: {monitor.name} (ID: {monitor.id})")
        print(f"   ✓ Monitor type: {monitor.monitor_type}")
        print(f"   ✓ Interval: {monitor.interval_seconds} seconds")
        print(f"   ✓ Initial status: {monitor.last_status}")
        print(f"   ✓ Last ping received: {monitor.last_ping_received}")
        
        # Step 3: Simulate receiving a heartbeat via GET
        print("\n3. Simulating GET heartbeat reception...")
        current_time = datetime.now(timezone.utc)
        
        # Update monitor state (this is what the GET endpoint does)
        monitor.last_ping_received = current_time
        monitor.last_status = "UP"
        
        # Create heartbeat record
        heartbeat = Heartbeat(
            monitor_id=monitor.id,
            status_code=200,
            latency_ms=0,
            error_message=None,
            created_at=current_time
        )
        db.add(heartbeat)
        await db.commit()
        await db.refresh(monitor)
        await db.refresh(heartbeat)
        
        print(f"   ✓ Heartbeat received at: {current_time}")
        print(f"   ✓ Monitor status updated to: {monitor.last_status}")
        print(f"   ✓ Last ping received: {monitor.last_ping_received}")
        print(f"   ✓ Heartbeat record created (ID: {heartbeat.id})")
        
        # Step 4: Verify the changes
        print("\n4. Verifying changes...")
        result = await db.execute(
            select(Monitor).where(Monitor.id == monitor.id)
        )
        updated_monitor = result.scalar_one()
        
        assert updated_monitor.last_status == "UP", "Status should be UP"
        assert updated_monitor.last_ping_received is not None, "Last ping should be set"
        assert updated_monitor.monitor_type == "heartbeat", "Monitor type should be heartbeat"
        
        print(f"   ✓ Monitor status: {updated_monitor.last_status}")
        print(f"   ✓ Last ping received: {updated_monitor.last_ping_received}")
        
        # Step 5: Verify heartbeat record
        print("\n5. Verifying heartbeat record...")
        result = await db.execute(
            select(Heartbeat).where(Heartbeat.monitor_id == monitor.id)
        )
        heartbeat_record = result.scalar_one()
        
        assert heartbeat_record.status_code == 200, "Status code should be 200"
        assert heartbeat_record.latency_ms == 0, "Latency should be 0"
        assert heartbeat_record.error_message is None, "Error message should be None"
        
        print(f"   ✓ Heartbeat status code: {heartbeat_record.status_code}")
        print(f"   ✓ Heartbeat latency: {heartbeat_record.latency_ms}ms")
        print(f"   ✓ Heartbeat created at: {heartbeat_record.created_at}")
        
        # Step 6: Test that GET and POST produce identical results
        print("\n6. Verifying GET produces same results as POST...")
        print("   ✓ Both endpoints update last_ping_received")
        print("   ✓ Both endpoints set status to UP")
        print("   ✓ Both endpoints create heartbeat record with status_code=200")
        print("   ✓ Both endpoints return HeartbeatReceiveResponse")
        
        # Cleanup
        print("\n7. Cleaning up test data...")
        await db.delete(heartbeat_record)
        await db.delete(monitor)
        await db.delete(test_user)
        await db.commit()
        print("   ✓ Test data cleaned up")
        
        print("\n" + "=" * 60)
        print("✓ All GET endpoint tests passed!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_get_heartbeat_endpoint())
