#!/bin/bash

echo "=========================================="
echo "PingSight Backend Restart Script"
echo "=========================================="
echo ""

# Find and kill existing uvicorn process
echo "1. Stopping existing backend server..."
pkill -f "uvicorn app.main:app"

# Wait a moment for the process to stop
sleep 2

# Check if it's still running
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "   ✗ Process still running, forcing kill..."
    pkill -9 -f "uvicorn app.main:app"
    sleep 1
else
    echo "   ✓ Backend stopped successfully"
fi

echo ""
echo "2. Starting backend server..."
cd backend

# Activate virtual environment and start server
source .venv/bin/activate

# Start in background
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Wait a moment for startup
sleep 3

# Check if it started
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "   ✓ Backend started successfully"
    echo ""
    echo "=========================================="
    echo "Backend is running on http://localhost:8000"
    echo "API docs: http://localhost:8000/docs"
    echo "Logs: backend/backend.log"
    echo "=========================================="
    echo ""
    echo "To view logs in real-time:"
    echo "  tail -f backend/backend.log"
    echo ""
    echo "To stop the backend:"
    echo "  pkill -f 'uvicorn app.main:app'"
else
    echo "   ✗ Failed to start backend"
    echo ""
    echo "Check backend/backend.log for errors"
    exit 1
fi
