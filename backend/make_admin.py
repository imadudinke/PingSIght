#!/usr/bin/env python3
"""
Script to manually promote a user to admin status.
Usage: python make_admin.py <email>
"""
import asyncio
import sys
from sqlalchemy import select
from app.db.session import async_session_maker
from app.models.user import User


async def make_admin(email: str):
    """Promote a user to admin by email."""
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User with email '{email}' not found.")
            return False
        
        if user.is_admin:
            print(f"✓ User '{email}' is already an admin.")
            return True
        
        user.is_admin = True
        await db.commit()
        print(f"✓ Successfully promoted '{email}' to admin.")
        return True


async def main():
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py <email>")
        print("Example: python make_admin.py user@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    success = await make_admin(email)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
