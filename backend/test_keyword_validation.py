"""
Test script to demonstrate keyword validation feature.
This shows how the keyword validation works in practice.
"""

# Example 1: Successful keyword validation
example_response_success = """
<!DOCTYPE html>
<html>
<head><title>Dashboard</title></head>
<body>
    <h1>Welcome to Your Dashboard</h1>
    <p>You are successfully logged in.</p>
</body>
</html>
"""

required_keyword = "Welcome"

# Case-insensitive search
if required_keyword.lower() in example_response_success.lower():
    print(f"✓ Keyword '{required_keyword}' found!")
    print("Status: UP")
else:
    print(f"✗ Keyword '{required_keyword}' NOT found!")
    print("Status: DOWN")

print("\n" + "="*50 + "\n")

# Example 2: Failed keyword validation (soft failure)
example_response_error = """
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
    <h1>Database Connection Error</h1>
    <p>Unable to connect to the database. Please try again later.</p>
</body>
</html>
"""

required_keyword = "Dashboard"

# Case-insensitive search
if required_keyword.lower() in example_response_error.lower():
    print(f"✓ Keyword '{required_keyword}' found!")
    print("Status: UP")
else:
    print(f"✗ Keyword '{required_keyword}' NOT found!")
    print("Status: DOWN")
    print(f"Error: Keyword '{required_keyword}' not found in page content")

print("\n" + "="*50 + "\n")

# Example 3: Case-insensitive matching
test_cases = [
    ("Welcome", "Welcome to our site", True),
    ("Welcome", "WELCOME TO OUR SITE", True),
    ("Welcome", "welcome to our site", True),
    ("Welcome", "WeLcOmE to our site", True),
    ("Dashboard", "Your dashboard is ready", True),
    ("Dashboard", "Error: Could not load", False),
    ("Login", "Please log in to continue", True),
    ("Login", "Logged out successfully", False),
]

print("Case-Insensitive Matching Tests:")
print("-" * 50)
for keyword, content, expected in test_cases:
    found = keyword.lower() in content.lower()
    status = "✓" if found == expected else "✗"
    print(f"{status} Keyword: '{keyword}' | Content: '{content[:30]}...' | Found: {found}")

print("\n" + "="*50 + "\n")

# Example 4: Short-circuit demonstration
print("Short-Circuit Example:")
print("-" * 50)

steps = [
    {"name": "Login", "url": "https://example.com/login", "keyword": "Welcome", "content": "Error: Invalid credentials"},
    {"name": "Dashboard", "url": "https://example.com/dashboard", "keyword": "Dashboard", "content": "Your Dashboard"},
    {"name": "Profile", "url": "https://example.com/profile", "keyword": "Profile", "content": "User Profile"},
]

for i, step in enumerate(steps, 1):
    print(f"\nStep {i}: {step['name']}")
    
    # Check keyword
    if step['keyword'].lower() in step['content'].lower():
        print(f"  ✓ Keyword '{step['keyword']}' found")
        print(f"  Status: UP")
    else:
        print(f"  ✗ Keyword '{step['keyword']}' NOT found")
        print(f"  Status: DOWN")
        print(f"  Error: Keyword '{step['keyword']}' not found in page content")
        print(f"\n  🛑 SHORT-CIRCUIT: Stopping at step {i}, skipping remaining {len(steps) - i} steps")
        break

print("\n" + "="*50 + "\n")

# Example 5: API Response Validation
import json

api_response_healthy = json.dumps({
    "status": "healthy",
    "database": "connected",
    "cache": "operational"
})

api_response_unhealthy = json.dumps({
    "status": "degraded",
    "database": "disconnected",
    "cache": "operational"
})

print("API Response Validation:")
print("-" * 50)

# Check for healthy status
keyword = '"status":"healthy"'
print(f"\nChecking for: {keyword}")
print(f"Response 1: {api_response_healthy}")
if keyword in api_response_healthy:
    print("✓ API is healthy")
else:
    print("✗ API is not healthy")

print(f"\nResponse 2: {api_response_unhealthy}")
if keyword in api_response_unhealthy:
    print("✓ API is healthy")
else:
    print("✗ API is not healthy")

print("\n" + "="*50 + "\n")

# Example 6: Real-world scenarios
print("Real-World Scenarios:")
print("-" * 50)

scenarios = [
    {
        "name": "E-commerce Product Page",
        "keyword": "Add to Cart",
        "success_content": "<button>Add to Cart</button>",
        "failure_content": "<p>Product out of stock</p>"
    },
    {
        "name": "User Dashboard",
        "keyword": "Welcome back",
        "success_content": "<h1>Welcome back, John!</h1>",
        "failure_content": "<h1>Please log in</h1>"
    },
    {
        "name": "Payment Gateway",
        "keyword": "Payment successful",
        "success_content": "<div>Payment successful! Order #12345</div>",
        "failure_content": "<div>Payment failed. Please try again.</div>"
    },
]

for scenario in scenarios:
    print(f"\n{scenario['name']}:")
    print(f"  Keyword: '{scenario['keyword']}'")
    
    # Test success case
    if scenario['keyword'].lower() in scenario['success_content'].lower():
        print(f"  ✓ Success case: Keyword found")
    else:
        print(f"  ✗ Success case: Keyword NOT found (unexpected!)")
    
    # Test failure case
    if scenario['keyword'].lower() in scenario['failure_content'].lower():
        print(f"  ✗ Failure case: Keyword found (unexpected!)")
    else:
        print(f"  ✓ Failure case: Keyword NOT found (correctly detected failure)")

print("\n" + "="*50)
print("All examples completed!")
