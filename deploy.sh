#!/bin/bash

# Putting Improver Deployment Script
# This script helps ensure version numbers are updated before deployment

echo "🚀 Putting Improver Deployment Script"
echo "======================================="
echo ""

# Get current version from service-worker.js
CURRENT_VERSION=$(grep "const CACHE_VERSION = " service-worker.js | sed "s/const CACHE_VERSION = '//g" | sed "s/'.*//g" | tr -d ';' | tr -d ' ')

echo "📦 Current version: $CURRENT_VERSION"
echo ""

# Ask if version should be updated
echo "Did you update the version numbers?"
echo "1. service-worker.js - line 2: const CACHE_VERSION = 'X.Y.Z'"
echo "2. index.html - in script section: const APP_VERSION = 'X.Y.Z'"
echo ""
read -p "Have you updated both version numbers? (y/n): " UPDATE_CONFIRMED

if [ "$UPDATE_CONFIRMED" != "y" ] && [ "$UPDATE_CONFIRMED" != "Y" ]; then
    echo "❌ Please update version numbers before deploying!"
    echo ""
    echo "Current version: $CURRENT_VERSION"
    echo "Suggested next version:"
    
    # Parse version
    IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
    MAJOR=${VERSION_PARTS[0]}
    MINOR=${VERSION_PARTS[1]}
    PATCH=${VERSION_PARTS[2]}
    
    # Calculate next versions
    NEXT_PATCH=$((PATCH + 1))
    NEXT_MINOR=$((MINOR + 1))
    NEXT_MAJOR=$((MAJOR + 1))
    
    echo "  - Patch (bug fix):     $MAJOR.$MINOR.$NEXT_PATCH"
    echo "  - Minor (new feature): $MAJOR.$NEXT_MINOR.0"
    echo "  - Major (breaking):    $NEXT_MAJOR.0.0"
    echo ""
    exit 1
fi

echo ""
echo "🔍 Running pre-deployment checks..."
echo ""

# Check if firebase tools are installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found!"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null
then
    echo "❌ Not logged in to Firebase!"
    echo "Run: firebase login"
    exit 1
fi

echo "✅ Firebase CLI ready"
echo ""

# Confirm deployment
read -p "🚀 Ready to deploy. Continue? (y/n): " DEPLOY_CONFIRMED

if [ "$DEPLOY_CONFIRMED" != "y" ] && [ "$DEPLOY_CONFIRMED" != "Y" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📤 Deploying to Firebase..."
echo ""

# Deploy
firebase deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Post-deployment checklist:"
    echo "  1. Visit your app and verify it loads"
    echo "  2. Check DevTools → Application → Service Workers"
    echo "  3. Verify version number in bottom-right corner"
    echo "  4. Test the update notification (wait 30s or switch tabs)"
    echo ""
    echo "🎉 All done! Users will get the update within 30 seconds."
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error messages above for details."
    exit 1
fi
