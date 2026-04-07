#!/bin/bash

# PingSight Backend Startup Script

set -e

echo "🚀 Starting PingSight Backend..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: 'uv' is not installed"
    echo "Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from template..."
    cat > .env << EOF
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/pingsight
SECRET_KEY=$(openssl rand -hex 32)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
    echo "✅ Created .env file. Please update with your credentials."
fi

# Install dependencies
echo "📦 Installing dependencies..."
uv sync

# Run migrations
echo "🗄️  Running database migrations..."
echo "   This will apply all pending migrations including:"
echo "   - Initial schema"
echo "   - User notification settings"
echo "   - Slack notifications (NEW)"
echo "   - Status pages"
echo ""

if alembic upgrade head; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed!"
    echo ""
    echo "Common fixes:"
    echo "1. Make sure PostgreSQL is running"
    echo "2. Check DATABASE_URL in .env file"
    echo "3. Verify database exists: psql -l | grep pingsight"
    echo "4. Create database if needed: createdb pingsight"
    echo ""
    exit 1
fi

# Start the server
echo ""
echo "✨ Starting server on http://localhost:8000"
echo "📚 API docs available at http://localhost:8000/docs"
echo "🔧 Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
