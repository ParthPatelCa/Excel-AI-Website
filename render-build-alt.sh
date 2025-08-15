#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Render build process..."

# Check Node.js version
echo "📋 Node.js version:"
node --version
npm --version

# Install frontend dependencies
echo "🔧 Installing frontend dependencies..."
cd excel-ai-frontend

# Clear any existing node_modules
rm -rf node_modules package-lock.json

# Install with verbose logging
npm install --production=false --verbose

echo "🏗️ Building frontend..."
npm run build

# Verify build output
echo "📁 Build output contents:"
ls -la dist/

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../excel_ai_backend
pip install -r requirements.txt

# Create static directory and copy frontend
echo "📁 Copying frontend build to backend static..."
mkdir -p src/static
cp -r ../excel-ai-frontend/dist/* ./src/static/

echo "✅ Build complete successfully!"
echo "📊 Final static directory contents:"
ls -la src/static/
