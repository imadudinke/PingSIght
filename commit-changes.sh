#!/bin/bash

# Script to properly commit and push changes to GitHub

echo "🔍 Checking for changes..."
echo ""

# Check git status
git status

echo ""
echo "📝 Files modified:"
git diff --name-only
git diff --cached --name-only

echo ""
echo "📦 Untracked files:"
git ls-files --others --exclude-standard

echo ""
echo "Would you like to:"
echo "1. Add all changes and commit"
echo "2. View detailed changes"
echo "3. Exit"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    read -p "Enter commit message: " message
    
    if [ -z "$message" ]; then
      echo "❌ Commit message cannot be empty"
      exit 1
    fi
    
    echo ""
    echo "📦 Adding all changes..."
    git add .
    
    echo "💾 Committing..."
    git commit -m "$message"
    
    echo ""
    read -p "Push to origin/main? (y/n): " push_choice
    
    if [ "$push_choice" = "y" ] || [ "$push_choice" = "Y" ]; then
      echo "🚀 Pushing to GitHub..."
      git push origin main
      echo "✅ Done!"
    else
      echo "⏸️  Changes committed locally but not pushed"
    fi
    ;;
    
  2)
    echo ""
    echo "📄 Detailed changes:"
    git diff
    git diff --cached
    ;;
    
  3)
    echo "👋 Exiting..."
    exit 0
    ;;
    
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
