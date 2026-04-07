#!/bin/bash

# Fix PingSight Database Migrations

echo "🔧 PingSight Migration Fix Script"
echo ""

cd "$(dirname "$0")"

# Check current migration status
echo "📊 Current migration status:"
alembic current

echo ""
echo "📋 Available migrations:"
alembic history

echo ""
echo "🔄 Applying all pending migrations..."
echo ""

if alembic upgrade head; then
    echo ""
    echo "✅ All migrations applied successfully!"
    echo ""
    echo "📊 Current migration status:"
    alembic current
    echo ""
    echo "You can now start the backend with: ./start.sh"
else
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo ""
    echo "1. Check if PostgreSQL is running:"
    echo "   sudo systemctl status postgresql"
    echo ""
    echo "2. Verify database connection:"
    echo "   psql -d pingsight -c 'SELECT 1;'"
    echo ""
    echo "3. Check if database exists:"
    echo "   psql -l | grep pingsight"
    echo ""
    echo "4. Create database if needed:"
    echo "   createdb pingsight"
    echo ""
    echo "5. Check .env file has correct DATABASE_URL"
    echo ""
    echo "6. If migrations are corrupted, you may need to:"
    echo "   alembic downgrade base"
    echo "   alembic upgrade head"
    echo ""
    exit 1
fi
