"""Check if blocked_emails table exists and its structure"""
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, inspect
from dotenv import load_dotenv

load_dotenv()

async def check_table():
    """Check the blocked_emails table"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment")
        return
    
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if table exists
        result = await session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'blocked_emails'
            )
        """))
        exists = result.scalar()
        print(f"Table 'blocked_emails' exists: {exists}")
        
        if exists:
            # Get table structure
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'blocked_emails'
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()
            print("\nTable structure:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")
            
            # Count rows
            result = await session.execute(text("SELECT COUNT(*) FROM blocked_emails"))
            count = result.scalar()
            print(f"\nTotal rows: {count}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_table())
