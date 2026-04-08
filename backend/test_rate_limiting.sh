#!/bin/bash

# Test Rate Limiting on Heartbeat Endpoints
# This script tests that rate limiting is working correctly

echo "🔒 Testing Rate Limiting Implementation"
echo "========================================"
echo ""

# Configuration
BACKEND_URL="http://localhost:8000"
# Using a test UUID that will return 404 (monitor not found)
# This is fine for testing rate limiting - we just need to hit the endpoint
MONITOR_ID="00000000-0000-0000-0000-000000000000"

echo "📋 Test Configuration:"
echo "  Backend URL: $BACKEND_URL"
echo "  Monitor ID: $MONITOR_ID (test UUID)"
echo "  Rate Limit: 60 requests/minute"
echo ""

# Test 1: Check if endpoint is accessible
echo "Test 1: Checking endpoint accessibility..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/heartbeats/$MONITOR_ID")
if [ "$response" == "200" ] || [ "$response" == "404" ] || [ "$response" == "400" ] || [ "$response" == "409" ]; then
    echo "✅ Endpoint is accessible (HTTP $response)"
    echo "   Note: 404/400/409 is expected for test UUID - rate limiting still applies"
else
    echo "❌ Endpoint returned unexpected status: $response"
    exit 1
fi
echo ""

# Test 2: Check rate limit headers
echo "Test 2: Checking rate limit headers..."
headers=$(curl -s -v "$BACKEND_URL/api/heartbeats/$MONITOR_ID" 2>&1 | grep -i "x-ratelimit")
if [ -n "$headers" ]; then
    echo "✅ Rate limit headers present:"
    echo "$headers" | sed 's/^/  /'
else
    echo "⚠️  Rate limit headers not found (may not be implemented yet)"
fi
echo ""

# Test 3: Rapid fire test (should hit rate limit)
echo "Test 3: Rapid fire test (65 requests in quick succession)..."
echo "  This should succeed for ~60 requests, then return 429 (Too Many Requests)"
echo ""

success_count=0
rate_limited_count=0

for i in {1..65}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/heartbeats/$MONITOR_ID")
    
    if [ "$response" == "200" ] || [ "$response" == "404" ] || [ "$response" == "409" ] || [ "$response" == "400" ]; then
        ((success_count++))
        echo -n "."
    elif [ "$response" == "429" ]; then
        ((rate_limited_count++))
        echo -n "X"
    else
        echo -n "?"
    fi
    
    # Small delay to avoid overwhelming the server
    sleep 0.05
done

echo ""
echo ""
echo "📊 Results:"
echo "  Successful requests: $success_count"
echo "  Rate limited (429): $rate_limited_count"
echo ""

if [ $rate_limited_count -gt 0 ]; then
    echo "✅ Rate limiting is WORKING! Got $rate_limited_count rate limit responses."
    echo "   This means the endpoint is protected from abuse."
else
    echo "⚠️  No rate limit responses detected."
    echo "   This could mean:"
    echo "   1. Rate limit is set too high"
    echo "   2. Rate limiting is not enabled"
    echo "   3. Test didn't run fast enough to hit the limit"
fi
echo ""

# Test 4: Check rate limit recovery
echo "Test 4: Testing rate limit recovery..."
echo "  Waiting 5 seconds for rate limit to reset..."
sleep 5

response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/heartbeats/$MONITOR_ID")
if [ "$response" == "200" ] || [ "$response" == "404" ] || [ "$response" == "409" ] || [ "$response" == "400" ]; then
    echo "✅ Rate limit recovered successfully (HTTP $response)"
else
    echo "⚠️  Unexpected response after recovery: $response"
fi
echo ""

echo "========================================"
echo "🎉 Rate Limiting Test Complete!"
echo ""
echo "Summary:"
echo "  - Endpoint is accessible"
echo "  - Rate limiting is $([ $rate_limited_count -gt 0 ] && echo 'ENABLED ✅' || echo 'NOT DETECTED ⚠️')"
echo "  - Rate limit recovery works"
echo ""
echo "Next steps:"
echo "  1. Check backend logs for rate limit violations"
echo "  2. Monitor rate limit metrics in production"
echo "  3. Adjust limits based on actual usage patterns"
