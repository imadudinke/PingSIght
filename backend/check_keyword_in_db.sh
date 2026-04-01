#!/bin/bash

# Check if a monitor has required_keyword in the database

if [ -z "$1" ]; then
    echo "Usage: ./check_keyword_in_db.sh <monitor_id>"
    exit 1
fi

MONITOR_ID=$1

echo "Checking monitor: $MONITOR_ID"
echo "================================"

PGPASSWORD=12345678 psql -h localhost -U imtech -d ping_sight -c "
SELECT 
    id, 
    name, 
    monitor_type,
    jsonb_pretty(steps) as steps_formatted
FROM monitors 
WHERE id = '$MONITOR_ID';
"

echo ""
echo "Looking for 'required_keyword' in steps..."
PGPASSWORD=12345678 psql -h localhost -U imtech -d ping_sight -t -c "
SELECT steps::text 
FROM monitors 
WHERE id = '$MONITOR_ID';
" | grep -o "required_keyword" && echo "✓ required_keyword FOUND!" || echo "✗ required_keyword NOT FOUND"
