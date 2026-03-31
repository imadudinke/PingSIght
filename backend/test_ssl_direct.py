#!/usr/bin/env python3
"""Direct test of SSL checker functionality"""

from app.worker.ssl_checker import get_ssl_info

# Test URLs
test_urls = [
    "https://httpbin.org/",
    "https://google.com",
    "https://github.com",
    "http://example.com",  # Should return None (not HTTPS)
]

for url in test_urls:
    print(f"\nTesting: {url}")
    print("-" * 50)
    result = get_ssl_info(url)
    if result:
        print(f"Status: {result['status']}")
        print(f"Days remaining: {result['days_remaining']}")
        print(f"Expiry date: {result['expiry_date']}")
    else:
        print("No SSL info (not HTTPS or failed)")
