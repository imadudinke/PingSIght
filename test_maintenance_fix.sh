#!/bin/bash

# Test script for maintenance mode transaction fix
# This tests that enabling maintenance mode doesn't cause transaction errors

echo "🧪 Testing Maintenance Mode Transaction Fix"
echo "==========================================="
echo ""

# Get your auth token first
echo "📝 Step 1: Login to get auth token"
echo "Run this command and copy the token:"
echo "curl -X POST http://localhost:8000/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"your@email.com\",\"password\":\"yourpassword\"}'"
echo ""
read -p "Enter your auth token: " TOKEN
echo ""

# Get monitor ID
echo "📝 Step 2: Get a monitor ID"
echo "Run this command to list your monitors:"
echo "curl -X GET http://localhost:8000/monitors -H 'Authorization: Bearer $TOKEN'"
echo ""
read -p "Enter a monitor ID to test: " MONITOR_ID
echo ""

# Enable maintenance mode for 1 minute
echo "🛡️  Step 3: Enable maintenance mode for 1 minute"
curl -X POST "http://localhost:8000/monitors/$MONITOR_ID/maintenance/enable" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 1}'
echo ""
echo ""

# Check status
echo "📊 Step 4: Check maintenance status"
curl -X GET "http://localhost:8000/monitors/$MONITOR_ID/maintenance/status" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "⏳ Step 5: Wait 70 seconds for auto-resume to trigger..."
echo "The worker will automatically resume monitoring after 1 minute."
echo "Watch the worker logs for:"
echo "  - [MAINTENANCE] ✓ Maintenance expired"
echo "  - [DB_COMMIT] Heartbeat saved and committed"
echo ""
echo "If you see transaction errors, the fix didn't work."
echo "If you see successful commits, the fix is working! ✓"
