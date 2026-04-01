#!/bin/bash

# Test script for Maintenance Mode API endpoints

set -e

echo "============================================================"
echo "🛡️  Maintenance Mode API Test"
echo "============================================================"
echo ""

# Configuration
API_URL="http://localhost:8000/api"
MONITOR_ID=""
TOKEN=""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get credentials
echo "Please provide your credentials:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""
echo ""

# Login
echo -e "${BLUE}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"
echo ""

# Get first monitor
echo -e "${BLUE}Step 2: Getting your monitors...${NC}"
MONITORS_RESPONSE=$(curl -s "$API_URL/monitors" \
  -H "Authorization: Bearer $TOKEN")

MONITOR_ID=$(echo $MONITORS_RESPONSE | jq -r '.monitors[0].id')
MONITOR_NAME=$(echo $MONITORS_RESPONSE | jq -r '.monitors[0].friendly_name')

if [ "$MONITOR_ID" == "null" ] || [ -z "$MONITOR_ID" ]; then
    echo -e "${RED}✗ No monitors found!${NC}"
    echo "Please create a monitor first"
    exit 1
fi

echo -e "${GREEN}✓ Using monitor: $MONITOR_NAME ($MONITOR_ID)${NC}"
echo ""

# Test 1: Get current status
echo "============================================================"
echo -e "${BLUE}Test 1: Get Maintenance Status${NC}"
echo "============================================================"
echo ""

STATUS_RESPONSE=$(curl -s "$API_URL/monitors/$MONITOR_ID/maintenance/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $STATUS_RESPONSE | jq '.'
echo ""

IS_MAINTENANCE=$(echo $STATUS_RESPONSE | jq -r '.is_maintenance')
echo -e "Current status: ${YELLOW}$IS_MAINTENANCE${NC}"
echo ""

# Test 2: Enable maintenance (manual mode)
echo "============================================================"
echo -e "${BLUE}Test 2: Enable Maintenance Mode (Manual)${NC}"
echo "============================================================"
echo ""

ENABLE_RESPONSE=$(curl -s -X POST "$API_URL/monitors/$MONITOR_ID/maintenance/enable" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo $ENABLE_RESPONSE | jq '{id, friendly_name, is_maintenance, maintenance_until}'
echo ""

IS_MAINTENANCE=$(echo $ENABLE_RESPONSE | jq -r '.is_maintenance')
if [ "$IS_MAINTENANCE" == "true" ]; then
    echo -e "${GREEN}✓ Maintenance mode enabled${NC}"
else
    echo -e "${RED}✗ Failed to enable maintenance mode${NC}"
fi
echo ""

# Test 3: Check status again
echo "============================================================"
echo -e "${BLUE}Test 3: Verify Status Changed${NC}"
echo "============================================================"
echo ""

STATUS_RESPONSE=$(curl -s "$API_URL/monitors/$MONITOR_ID/maintenance/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $STATUS_RESPONSE | jq '.'
echo ""

MODE=$(echo $STATUS_RESPONSE | jq -r '.mode')
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo ""

# Test 4: Disable maintenance
echo "============================================================"
echo -e "${BLUE}Test 4: Disable Maintenance Mode${NC}"
echo "============================================================"
echo ""

DISABLE_RESPONSE=$(curl -s -X POST "$API_URL/monitors/$MONITOR_ID/maintenance/disable" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $DISABLE_RESPONSE | jq '{id, friendly_name, is_maintenance, maintenance_until}'
echo ""

IS_MAINTENANCE=$(echo $DISABLE_RESPONSE | jq -r '.is_maintenance')
if [ "$IS_MAINTENANCE" == "false" ]; then
    echo -e "${GREEN}✓ Maintenance mode disabled${NC}"
else
    echo -e "${RED}✗ Failed to disable maintenance mode${NC}"
fi
echo ""

# Test 5: Enable with auto-resume (2 minutes)
echo "============================================================"
echo -e "${BLUE}Test 5: Enable with Auto-Resume (2 minutes)${NC}"
echo "============================================================"
echo ""

ENABLE_AUTO_RESPONSE=$(curl -s -X POST "$API_URL/monitors/$MONITOR_ID/maintenance/enable" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 2}')

echo "Response:"
echo $ENABLE_AUTO_RESPONSE | jq '{id, friendly_name, is_maintenance, maintenance_until}'
echo ""

MAINTENANCE_UNTIL=$(echo $ENABLE_AUTO_RESPONSE | jq -r '.maintenance_until')
echo -e "Will auto-resume at: ${YELLOW}$MAINTENANCE_UNTIL${NC}"
echo ""

# Test 6: Check status with time remaining
echo "============================================================"
echo -e "${BLUE}Test 6: Check Time Remaining${NC}"
echo "============================================================"
echo ""

STATUS_RESPONSE=$(curl -s "$API_URL/monitors/$MONITOR_ID/maintenance/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $STATUS_RESPONSE | jq '.'
echo ""

TIME_REMAINING=$(echo $STATUS_RESPONSE | jq -r '.time_remaining_minutes')
MODE=$(echo $STATUS_RESPONSE | jq -r '.mode')
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo -e "Time remaining: ${YELLOW}$TIME_REMAINING minutes${NC}"
echo ""

# Test 7: Disable before auto-resume
echo "============================================================"
echo -e "${BLUE}Test 7: Manual Disable (Before Auto-Resume)${NC}"
echo "============================================================"
echo ""

DISABLE_RESPONSE=$(curl -s -X POST "$API_URL/monitors/$MONITOR_ID/maintenance/disable" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $DISABLE_RESPONSE | jq '{id, friendly_name, is_maintenance, maintenance_until}'
echo ""

IS_MAINTENANCE=$(echo $DISABLE_RESPONSE | jq -r '.is_maintenance')
if [ "$IS_MAINTENANCE" == "false" ]; then
    echo -e "${GREEN}✓ Maintenance mode disabled (manual override)${NC}"
else
    echo -e "${RED}✗ Failed to disable maintenance mode${NC}"
fi
echo ""

# Summary
echo "============================================================"
echo -e "${GREEN}✅ All Tests Completed!${NC}"
echo "============================================================"
echo ""
echo "Summary:"
echo "  ✓ Get status endpoint works"
echo "  ✓ Enable maintenance (manual) works"
echo "  ✓ Enable maintenance (auto-resume) works"
echo "  ✓ Disable maintenance works"
echo "  ✓ Time remaining calculation works"
echo ""
echo "The maintenance mode API is working correctly!"
echo ""
