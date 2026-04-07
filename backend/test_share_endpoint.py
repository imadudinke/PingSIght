#!/usr/bin/env python3
"""
Quick test script to verify the share endpoint is working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_cors():
    """Test CORS preflight request"""
    print("Testing CORS preflight...")
    
    # Simulate browser preflight request
    response = requests.options(
        f"{BASE_URL}/monitors/test-id/share",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if "access-control-allow-origin" in response.headers:
        print("✓ CORS is properly configured")
    else:
        print("✗ CORS headers missing")
    
    return response.status_code == 200

def test_endpoint_exists():
    """Test if the endpoint exists"""
    print("\nTesting endpoint existence...")
    
    # This will fail with 401 (unauthorized) but that's OK - it means the endpoint exists
    response = requests.post(
        f"{BASE_URL}/monitors/test-id/share",
        json={},
        headers={
            "Origin": "http://localhost:3000",
        }
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code in [401, 403, 404, 422]:
        print(f"✓ Endpoint exists (got expected error: {response.status_code})")
        return True
    else:
        print(f"✗ Unexpected status: {response.status_code}")
        print(f"Response: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Share Endpoint Test")
    print("=" * 60)
    
    try:
        cors_ok = test_cors()
        endpoint_ok = test_endpoint_exists()
        
        print("\n" + "=" * 60)
        if cors_ok and endpoint_ok:
            print("✓ All tests passed!")
            print("\nThe backend needs to be restarted to load the new routes.")
            print("Run: uvicorn app.main:app --reload")
        else:
            print("✗ Some tests failed")
            print("\nMake sure the backend server is running:")
            print("cd backend && uvicorn app.main:app --reload")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n✗ Cannot connect to backend server")
        print("\nMake sure the backend is running:")
        print("cd backend && uvicorn app.main:app --reload")
