#!/usr/bin/env python3
"""
Convert Render's PostgreSQL URL to the format needed by SQLAlchemy with asyncpg.

Render provides: postgresql://user:pass@host/db
We need:         postgresql+psycopg://user:pass@host/db

Usage: python convert_db_url.py <database_url>
"""
import sys


def convert_database_url(url: str) -> str:
    """Convert PostgreSQL URL to asyncpg format."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql+psycopg://"):
        return url  # Already converted
    else:
        raise ValueError(f"Invalid PostgreSQL URL format: {url}")


def main():
    if len(sys.argv) != 2:
        print("Usage: python convert_db_url.py <database_url>")
        print()
        print("Example:")
        print("  python convert_db_url.py 'postgresql://user:pass@host/db'")
        print()
        print("Output:")
        print("  postgresql+psycopg://user:pass@host/db")
        sys.exit(1)
    
    original_url = sys.argv[1]
    
    try:
        converted_url = convert_database_url(original_url)
        
        print("=" * 70)
        print("DATABASE URL CONVERSION")
        print("=" * 70)
        print()
        print("Original URL:")
        print(f"  {original_url}")
        print()
        print("Converted URL (use this in Render):")
        print(f"  {converted_url}")
        print()
        print("=" * 70)
        print()
        print("Copy the converted URL and paste it as DATABASE_URL in Render dashboard.")
        print()
        
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
