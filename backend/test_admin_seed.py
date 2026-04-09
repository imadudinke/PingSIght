#!/usr/bin/env python3
"""
Test script to verify admin seed email configuration.
Usage: python test_admin_seed.py
"""
import os

def load_env_file():
    """Load .env file manually."""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

def test_admin_seed_config():
    """Test that admin seed emails are properly configured."""
    print("=" * 60)
    print("ADMIN SEED EMAIL CONFIGURATION TEST")
    print("=" * 60)
    
    # Get the admin seed emails from environment
    admin_emails_str = os.getenv("ADMIN_SEED_EMAILS", "")
    
    if not admin_emails_str:
        print("❌ ADMIN_SEED_EMAILS not found in environment variables")
        print("   Please add it to your .env file:")
        print("   ADMIN_SEED_EMAILS=imadudinkeremu@gmail.com")
        return False
    
    print(f"✓ ADMIN_SEED_EMAILS found: {admin_emails_str}")
    
    # Parse the emails
    admin_emails = set(
        email.strip() 
        for email in admin_emails_str.split(",")
        if email.strip()
    )
    
    print(f"\n✓ Parsed {len(admin_emails)} admin email(s):")
    for email in sorted(admin_emails):
        print(f"  • {email}")
    
    # Check for the default admin
    default_admin = "imadudinkeremu@gmail.com"
    if default_admin in admin_emails:
        print(f"\n✓ Default admin email '{default_admin}' is configured")
    else:
        print(f"\n⚠ Warning: Default admin email '{default_admin}' not found")
        print(f"  Current admin emails: {', '.join(admin_emails)}")
    
    print("\n" + "=" * 60)
    print("CONFIGURATION TEST PASSED")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start the backend: uvicorn app.main:app --reload")
    print("2. Start the frontend: npm run dev")
    print("3. Log in with an admin email")
    print("4. Verify admin access in /dashboard/admin")
    
    return True


if __name__ == "__main__":
    import sys
    load_env_file()
    success = test_admin_seed_config()
    sys.exit(0 if success else 1)
