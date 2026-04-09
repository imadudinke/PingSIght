#!/bin/bash

echo "Clearing Next.js cache..."

# Remove .next directory
rm -rf .next

# Remove node_modules/.cache if it exists
rm -rf node_modules/.cache

echo "Cache cleared! Please restart your dev server."
echo "Run: npm run dev"
