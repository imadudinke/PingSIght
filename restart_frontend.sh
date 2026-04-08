#!/bin/bash

# Restart Frontend Script
# This script clears the Next.js cache and restarts the frontend dev server

echo "🧹 Clearing Next.js build cache..."
cd frontend
rm -rf .next

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting frontend dev server..."
echo "   Run this command in your terminal:"
echo ""
echo "   cd frontend && npm run dev"
echo ""
echo "📝 After starting:"
echo "   1. Open browser to http://localhost:3000"
echo "   2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   3. Login to your account"
echo "   4. Navigate to a monitor detail page"
echo "   5. Click 'PROCESS_INCIDENTS' button"
echo ""
echo "✨ The incident management feature should now work!"
