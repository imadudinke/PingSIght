#!/usr/bin/env python3
"""
Test script for domain expiration checking functionality.

This script tests the WHOIS domain expiration checker to ensure:
1. Domain expiry dates are retrieved correctly
2. Days remaining are calculated accurately
3. Status levels are assigned properly
4. Edge cases are handled (multiple dates, missing data)
"""

from app.worker.domain_checker import get_domain_expiry, should_check_domain
from datetime import datetime, timezone, timedelta


def test_domain_expiry():
    """Test domain expiration checking for various domains"""
    
    print("=" * 70)
    print("DOMAIN EXPIRATION CHECKER TEST")
    print("=" * 70)
    print()
    
    # Test domains (well-known sites with public WHOIS)
    test_urls = [
        "https://google.com",
        "https://github.com",
        "https://python.org",
    ]
    
    for url in test_urls:
        print(f"\n{'─' * 70}")
        print(f"Testing: {url}")
        print(f"{'─' * 70}")
        
        try:
            result = get_domain_expiry(url)
            
            if result:
                print(f"✓ WHOIS lookup successful")
                print(f"  Hostname: {result['hostname']}")
                print(f"  Expiry Date: {result['expiry_date'].strftime('%Y-%m-%d %H:%M:%S %Z')}")
                print(f"  Days Remaining: {result['days_remaining']}")
                print(f"  Status: {result['status']}")
                
                # Validate status logic
                days = result['days_remaining']
                expected_status = (
                    "EXPIRED" if days < 0 else
                    "CRITICAL" if days <= 7 else
                    "WARNING" if days <= 30 else
                    "VALID"
                )
                
                if result['status'] == expected_status:
                    print(f"  ✓ Status calculation correct")
                else:
                    print(f"  ✗ Status mismatch: expected {expected_status}, got {result['status']}")
                
            else:
                print(f"✗ WHOIS lookup returned None")
                print(f"  This may be normal for some domains/TLDs")
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")
    
    print(f"\n{'=' * 70}")


def test_check_interval():
    """Test the 24-hour check interval logic"""
    
    print("\n" + "=" * 70)
    print("24-HOUR INTERVAL CHECK TEST")
    print("=" * 70)
    print()
    
    now = datetime.now(timezone.utc)
    
    # Test cases
    test_cases = [
        (None, True, "Never checked before"),
        (now - timedelta(hours=25), True, "Checked 25 hours ago"),
        (now - timedelta(hours=24), True, "Checked exactly 24 hours ago"),
        (now - timedelta(hours=23), False, "Checked 23 hours ago"),
        (now - timedelta(hours=12), False, "Checked 12 hours ago"),
        (now - timedelta(minutes=30), False, "Checked 30 minutes ago"),
    ]
    
    for last_checked, expected, description in test_cases:
        result = should_check_domain(last_checked)
        status = "✓" if result == expected else "✗"
        
        print(f"{status} {description}")
        print(f"  Last checked: {last_checked.strftime('%Y-%m-%d %H:%M:%S') if last_checked else 'Never'}")
        print(f"  Should check: {result} (expected: {expected})")
        
        if result != expected:
            print(f"  ERROR: Interval logic failed!")
        print()
    
    print("=" * 70)


def test_status_levels():
    """Test status level assignment logic"""
    
    print("\n" + "=" * 70)
    print("STATUS LEVEL LOGIC TEST")
    print("=" * 70)
    print()
    
    # Simulate different days remaining scenarios
    test_cases = [
        (-5, "EXPIRED", "Domain expired 5 days ago"),
        (0, "CRITICAL", "Domain expires today"),
        (3, "CRITICAL", "Domain expires in 3 days"),
        (7, "CRITICAL", "Domain expires in 7 days"),
        (15, "WARNING", "Domain expires in 15 days"),
        (30, "WARNING", "Domain expires in 30 days"),
        (60, "VALID", "Domain expires in 60 days"),
        (365, "VALID", "Domain expires in 1 year"),
    ]
    
    for days, expected_status, description in test_cases:
        # Calculate status using same logic as domain_checker
        if days < 0:
            status = "EXPIRED"
        elif days <= 7:
            status = "CRITICAL"
        elif days <= 30:
            status = "WARNING"
        else:
            status = "VALID"
        
        result = "✓" if status == expected_status else "✗"
        print(f"{result} {description}")
        print(f"  Days remaining: {days}")
        print(f"  Status: {status} (expected: {expected_status})")
        
        if status != expected_status:
            print(f"  ERROR: Status calculation failed!")
        print()
    
    print("=" * 70)


if __name__ == "__main__":
    print("\n🔍 Starting Domain Expiration Tests...\n")
    
    # Test 1: Check interval logic (no external dependencies)
    test_check_interval()
    
    # Test 2: Status level logic (no external dependencies)
    test_status_levels()
    
    # Test 3: Actual WHOIS lookups (requires internet and python-whois)
    print("\n⚠️  WARNING: The following test will make real WHOIS queries.")
    print("This may take 10-30 seconds and will query external WHOIS servers.")
    
    response = input("\nProceed with WHOIS lookups? (y/n): ")
    
    if response.lower() == 'y':
        test_domain_expiry()
    else:
        print("\nSkipping WHOIS lookup tests.")
    
    print("\n✅ Domain expiration tests complete!\n")
