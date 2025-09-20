#!/bin/bash

# CapRover Deployment Script for NanoBananaEditor

echo "🚀 Starting CapRover deployment process..."

# Check if caprover CLI is installed
if ! command -v caprover &> /dev/null; then
    echo "❌ CapRover CLI is not installed. Installing..."
    npm install -g caprover
fi

# Build the application
echo "📦 Building the application..."
npm run build

# Create deployment archive
echo "📁 Creating deployment archive..."
tar -czf deploy.tar.gz captain-definition Dockerfile nginx.conf .dockerignore package*.json dist/ src/ index.html vite.config.ts tsconfig*.json postcss.config.js tailwind.config.js eslint.config.js

echo "✅ Deployment archive created: deploy.tar.gz"

# Deploy to CapRover
echo "🚢 Deploying to CapRover..."
echo "Make sure you have configured your CapRover server details."
echo "Run: caprover serversetup (if not already configured)"
echo ""
echo "To deploy, run:"
echo "caprover deploy -t ./deploy.tar.gz"
echo ""
echo "Or use: npm run caprover:deploy"