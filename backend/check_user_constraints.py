"""Check foreign key constraints on users table"""
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def check_constraints():
    """Check what tables reference the users table"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment")
        return
    
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get all foreign keys referencing users table
        result = await session.execute(text("""
            SELECT
                tc.table_name, 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'users'
            ORDER BY tc.table_name
        """))
        
        constraints = result.fetchall()
        print("Tables with foreign keys to 'users':")
        print("-" * 80)
        for constraint in constraints:
            print(f"Table: {constraint[0]}")
            print(f"  Column: {constraint[1]} -> users.{constraint[3]}")
            print(f"  On Delete: {constraint[4]}")
            print()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_constraints())
