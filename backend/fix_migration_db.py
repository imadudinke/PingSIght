"""Fix migration database issue by directly updating alembic_version table"""
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def fix_migration():
    """Fix the migration version in the database"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment")
        return
    
    engine = create_async_engine(database_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check current version
        result = await session.execute(text("SELECT version_num FROM alembic_version"))
        current = result.scalar_one_or_none()
        print(f"Current migration version: {current}")
        
        # Update to the correct version
        await session.execute(
            text("UPDATE alembic_version SET version_num = '4834295acc04'")
        )
        await session.commit()
        print("✓ Fixed migration version to 4834295acc04")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_migration())
