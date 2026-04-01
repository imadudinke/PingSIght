"""
Test script for anomaly detection functionality.
Creates monitors for the test server and verifies anomaly detection works.
"""

import requests
import time
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api"
TEST_SERVER_URL = "http://localhost:8001"
AUTH_TOKEN = None  # Will be set after login

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header(text):
    """Print a formatted header"""
    print(f"\n{'=' * 60}")
    print(f"{BLUE}{text}{RESET}")
    print('=' * 60)


def print_success(text):
    """Print success message"""
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text):
    """Print error message"""
    print(f"{RED}✗ {text}{RESET}")


def print_warning(text):
    """Print warning message"""
    print(f"{YELLOW}⚠ {text}{RESET}")


def print_info(text):
    """Print info message"""
    print(f"  {text}")


def login():
    """Login and get auth token"""
    global AUTH_TOKEN
    
    print_header("Step 1: Authentication")
    
    # Try to login (adjust credentials as needed)
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        
        if response.status_code == 200:
            AUTH_TOKEN = response.json()["access_token"]
            print_success("Logged in successfully")
            return True
        else:
            print_error(f"Login failed: {response.status_code}")
            print_info("Please create a user account first or update credentials in script")
            return False
            
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        print_info("Make sure the PingSight API is running on port 8000")
        return False


def check_test_server():
    """Check if test server is running"""
    print_header("Step 2: Checking Test Server")
    
    try:
        response = requests.get(f"{TEST_SERVER_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Test server is running on port 8001")
            return True
        else:
            print_error("Test server returned unexpected status")
            return False
    except Exception as e:
        print_error(f"Test server not accessible: {str(e)}")
        print_info("Please start the test server first:")
        print_info("  python test_anomaly_server.py")
        return False


def create_monitor(name, url, interval=30):
    """Create a simple monitor"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/monitors",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
            json={
                "url": url,
                "friendly_name": name,
                "interval_seconds": interval,
                "monitor_type": "simple"
            }
        )
        
        if response.status_code == 200:
            monitor = response.json()
            print_success(f"Created monitor: {name}")
            print_info(f"  Monitor ID: {monitor['id']}")
            print_info(f"  URL: {url}")
            print_info(f"  Interval: {interval}s")
            return monitor['id']
        else:
            print_error(f"Failed to create monitor: {response.status_code}")
            print_info(f"  Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error creating monitor: {str(e)}")
        return None


def get_monitor_details(monitor_id):
    """Get monitor details with heartbeats"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/monitors/{monitor_id}",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except Exception as e:
        print_error(f"Error getting monitor: {str(e)}")
        return None


def analyze_heartbeats(monitor_data):
    """Analyze heartbeats for anomalies"""
    heartbeats = monitor_data.get("recent_heartbeats", [])
    
    if not heartbeats:
        print_warning("No heartbeats yet")
        return
    
    print_info(f"Total heartbeats: {len(heartbeats)}")
    
    # Calculate statistics
    latencies = [hb["latency_ms"] for hb in heartbeats]
    anomalies = [hb for hb in heartbeats if hb.get("is_anomaly", False)]
    
    avg_latency = sum(latencies) / len(latencies)
    min_latency = min(latencies)
    max_latency = max(latencies)
    
    print_info(f"Average latency: {avg_latency:.2f}ms")
    print_info(f"Min latency: {min_latency:.2f}ms")
    print_info(f"Max latency: {max_latency:.2f}ms")
    print_info(f"Anomalies detected: {len(anomalies)}")
    
    # Show anomalies
    if anomalies:
        print_warning(f"\nAnomalies found:")
        for hb in anomalies:
            print_info(f"  • {hb['latency_ms']:.2f}ms at {hb['created_at']}")
    
    return len(anomalies) > 0


def wait_for_checks(monitor_id, count=12, interval=30):
    """Wait for multiple checks to complete"""
    print_info(f"Waiting for {count} checks (approximately {count * interval // 60} minutes)...")
    print_info("You can monitor progress in the logs or check the API")
    
    for i in range(count):
        time.sleep(interval)
        print_info(f"  Check {i + 1}/{count} completed")
        
        # Get current status
        monitor = get_monitor_details(monitor_id)
        if monitor:
            heartbeats = monitor.get("recent_heartbeats", [])
            if heartbeats:
                latest = heartbeats[0]
                latency = latest["latency_ms"]
                is_anomaly = latest.get("is_anomaly", False)
                
                if is_anomaly:
                    print_warning(f"    ⚠️  ANOMALY: {latency:.2f}ms")
                else:
                    print_success(f"    ✓ Normal: {latency:.2f}ms")


def run_test():
    """Run the complete anomaly detection test"""
    print_header("🧪 Anomaly Detection Test Suite")
    print_info("This test will verify that anomaly detection works correctly")
    print()
    
    # Step 1: Login
    if not login():
        return
    
    # Step 2: Check test server
    if not check_test_server():
        return
    
    # Step 3: Create monitors
    print_header("Step 3: Creating Test Monitors")
    
    monitors = {}
    
    # Monitor 1: Normal endpoint (should have no anomalies)
    monitors["normal"] = create_monitor(
        "Test - Normal Endpoint",
        f"{TEST_SERVER_URL}/normal",
        interval=30
    )
    
    time.sleep(1)
    
    # Monitor 2: Random endpoint (should have some anomalies)
    monitors["random"] = create_monitor(
        "Test - Random Endpoint",
        f"{TEST_SERVER_URL}/random",
        interval=30
    )
    
    time.sleep(1)
    
    # Monitor 3: Slow endpoint (should have many anomalies)
    monitors["slow"] = create_monitor(
        "Test - Slow Endpoint",
        f"{TEST_SERVER_URL}/slow",
        interval=30
    )
    
    if not all(monitors.values()):
        print_error("Failed to create all monitors")
        return
    
    # Step 4: Wait for initial checks
    print_header("Step 4: Waiting for Initial Checks")
    print_info("Waiting for 10+ checks to build baseline...")
    print_info("This will take about 5-6 minutes")
    
    wait_for_checks(monitors["normal"], count=12, interval=30)
    
    # Step 5: Analyze results
    print_header("Step 5: Analyzing Results")
    
    results = {}
    
    for name, monitor_id in monitors.items():
        print(f"\n{BLUE}Monitor: {name.upper()}{RESET}")
        monitor_data = get_monitor_details(monitor_id)
        
        if monitor_data:
            has_anomalies = analyze_heartbeats(monitor_data)
            results[name] = has_anomalies
        else:
            print_error("Failed to get monitor data")
    
    # Step 6: Verify expectations
    print_header("Step 6: Verification")
    
    print_info("\nExpected Results:")
    print_info("  • Normal endpoint: Few or no anomalies")
    print_info("  • Random endpoint: Some anomalies (~20%)")
    print_info("  • Slow endpoint: Many anomalies (most checks)")
    
    print_info("\nActual Results:")
    for name, has_anomalies in results.items():
        if name == "normal":
            if not has_anomalies:
                print_success(f"  • {name}: No anomalies (as expected)")
            else:
                print_warning(f"  • {name}: Has anomalies (unexpected)")
        elif name == "slow":
            if has_anomalies:
                print_success(f"  • {name}: Has anomalies (as expected)")
            else:
                print_warning(f"  • {name}: No anomalies (unexpected)")
        else:
            print_info(f"  • {name}: {'Has' if has_anomalies else 'No'} anomalies")
    
    # Step 7: Summary
    print_header("📊 Test Summary")
    
    if results.get("slow"):
        print_success("✓ Anomaly detection is working!")
        print_info("  The slow endpoint triggered anomaly flags as expected")
    else:
        print_warning("⚠ Anomaly detection may not be working correctly")
        print_info("  The slow endpoint should have triggered anomalies")
    
    print_info("\nMonitor IDs for manual inspection:")
    for name, monitor_id in monitors.items():
        print_info(f"  • {name}: {monitor_id}")
    
    print_info("\nYou can view detailed results at:")
    print_info(f"  {API_BASE_URL}/monitors/{{monitor_id}}")
    
    print()


if __name__ == "__main__":
    try:
        run_test()
    except KeyboardInterrupt:
        print_warning("\n\nTest interrupted by user")
    except Exception as e:
        print_error(f"\nTest failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
