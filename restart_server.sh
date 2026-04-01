#!/bin/bash

echo "🔄 Restarting PingSight Server..."
echo ""

# Find and kill the uvicorn process
echo "Stopping current server..."
pkill -f "uvicorn app.main:app"
sleep 2

# Check if it's still running
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "⚠️  Server still running, force killing..."
    pkill -9 -f "uvicorn app.main:app"
    sleep 1
fi

echo "✓ Server stopped"
echo ""

# Start the server
echo "Starting server with domain checking enabled..."
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

sleep 3

# Check if server started
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "✓ Server started successfully"
    echo ""
    echo "📊 Checking scheduler status..."
    sleep 2
    curl -s http://localhost:8000/health | python -m json.tool | head -15
    echo ""
    echo "✅ Server is running with domain checking enabled!"
    echo ""
    echo "Next steps:"
    echo "1. Wait 60 seconds for next check cycle"
    echo "2. Check monitor details to see domain fields populated"
    echo "3. Look for [WHOIS] logs in server output"
else
    echo "❌ Failed to start server"
    exit 1
fi
