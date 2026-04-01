#!/bin/bash

echo "🔄 Full Server Restart (Fixing Transaction Errors)..."
echo ""

# Kill all Python processes related to the app
echo "Stopping all server processes..."
pkill -9 -f "uvicorn app.main:app"
pkill -9 -f "app.worker.scheduler"
sleep 2

echo "✓ All processes stopped"
echo ""

# Start fresh
echo "Starting server with fresh code..."
cd backend

# Run in foreground so you can see logs
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# If you want to run in background instead, use:
# uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > server.log 2>&1 &
# echo "✓ Server started in background (logs in backend/server.log)"
