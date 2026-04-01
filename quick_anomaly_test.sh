#!/bin/bash

# Quick Anomaly Detection Test Script
# This script creates monitors and shows you how to verify anomaly detection

set -e

echo "============================================================"
echo "🧪 Quick Anomaly Detection Test"
echo "============================================================"
echo ""

# Configuration
API_URL="http://localhost:8000/api"
TEST_SERVER="http://localhost:8001"

# Check if test server is running
echo "Step 1: Checking test server..."
if curl -s "$TEST_SERVER/health" > /dev/null; then
    echo "✓ Test server is running on port 8001"
else
    echo "✗ Test server is not running!"
    echo "  Please run: python test_anomaly_server.py"
    exit 1
fi

echo ""
echo "Step 2: Login to PingSight API"
echo "Please provide your credentials:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

# Login and get token
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "✗ Login failed!"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✓ Logged in successfully"
echo ""

# Create monitors
echo "Step 3: Creating test monitors..."
echo ""

# Monitor 1: Normal endpoint
echo "Creating monitor for NORMAL endpoint (200-400ms)..."
NORMAL_RESPONSE=$(curl -s -X POST "$API_URL/monitors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/normal",
    "friendly_name": "Anomaly Test - Normal",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }')

NORMAL_ID=$(echo $NORMAL_RESPONSE | jq -r '.id')
echo "✓ Created: $NORMAL_ID"

sleep 1

# Monitor 2: Slow endpoint
echo "Creating monitor for SLOW endpoint (2000-3000ms)..."
SLOW_RESPONSE=$(curl -s -X POST "$API_URL/monitors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8001/slow",
    "friendly_name": "Anomaly Test - Slow",
    "interval_seconds": 30,
    "monitor_type": "simple"
  }')

SLOW_ID=$(echo $SLOW_RESPONSE | jq -r '.id')
echo "✓ Created: $SLOW_ID"

echo ""
echo "============================================================"
echo "✓ Setup Complete!"
echo "============================================================"
echo ""
echo "Monitor IDs:"
echo "  Normal: $NORMAL_ID"
echo "  Slow:   $SLOW_ID"
echo ""
echo "Next Steps:"
echo "  1. Wait 5-6 minutes for 10+ checks to build baseline"
echo "  2. Check results with:"
echo ""
echo "     curl http://localhost:8000/api/monitors/$NORMAL_ID \\"
echo "       -H \"Authorization: Bearer $TOKEN\" | jq '.recent_heartbeats[] | {latency_ms, is_anomaly}'"
echo ""
echo "     curl http://localhost:8000/api/monitors/$SLOW_ID \\"
echo "       -H \"Authorization: Bearer $TOKEN\" | jq '.recent_heartbeats[] | {latency_ms, is_anomaly}'"
echo ""
echo "  3. Watch logs for anomaly detection:"
echo "     tail -f backend/logs/app.log | grep ANOMALY"
echo ""
echo "Expected Results:"
echo "  • Normal endpoint: is_anomaly = false (most checks)"
echo "  • Slow endpoint: is_anomaly = true (after baseline established)"
echo ""
echo "============================================================"
echo "⏱️  Waiting for first check (30 seconds)..."
echo "============================================================"

# Wait for first check
sleep 35

echo ""
echo "First check completed! Checking results..."
echo ""

# Check normal endpoint
echo "Normal Endpoint Results:"
curl -s "$API_URL/monitors/$NORMAL_ID" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.recent_heartbeats[0] | {latency_ms, is_anomaly, created_at}'

echo ""

# Check slow endpoint
echo "Slow Endpoint Results:"
curl -s "$API_URL/monitors/$SLOW_ID" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.recent_heartbeats[0] | {latency_ms, is_anomaly, created_at}'

echo ""
echo "============================================================"
echo "Note: Anomaly detection needs 10+ checks to establish baseline"
echo "Current: 1 check completed"
echo "Wait 5 more minutes for full baseline, then check again!"
echo "============================================================"
