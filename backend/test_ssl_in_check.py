#!/usr/bin/env python3
"""Test SSL check within perform_check function"""
import asyncio
import sys
sys.path.insert(0, '/home/imtech/Desktop/pingSight/backend')

from uuid import UUID
from app.worker.engine import perform_check
from app.db.session import AsyncSessionLocal

async def test_check():
    # Test with the Better Auth monitor
    monitor_id = UUID("cf0b4687-8715-44fb-afdc-c9b805a9e44a")
    url = "https://better-auth.com/"
    
    async with AsyncSessionLocal() as db:
        print(f"Testing perform_check for {url}")
        print("=" * 60)
        result = await perform_check(monitor_id, url, db)
        print("=" * 60)
        print(f"Result: {result}")
        print(f"SSL in result: {result.get('ssl', 'NOT PRESENT')}")

if __name__ == "__main__":
    asyncio.run(test_check())
