#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Ultra-Robust Render build process..."

# Check environment
echo "📋 Environment check:"
echo "Current directory: $(pwd)"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Python version: $(python --version)"

# Install frontend dependencies with multiple fallback strategies
echo "🔧 Installing frontend dependencies..."
cd excel-ai-frontend

# Strategy 1: Try npm install with clean slate
echo "📦 Strategy 1: Clean npm install..."
rm -rf node_modules package-lock.json
npm cache clean --force

# Try different npm install approaches
if npm install --production=false --verbose --no-optional; then
    echo "✅ npm install successful with --no-optional"
elif npm install --production=false --verbose --legacy-peer-deps; then
    echo "✅ npm install successful with --legacy-peer-deps"
elif npm install --production=false --verbose --force; then
    echo "✅ npm install successful with --force"
else
    echo "❌ All npm install strategies failed"
    echo "📋 npm debug log contents:"
    cat /root/.npm/_logs/*.log | tail -50
    exit 1
fi

echo "🏗️ Building frontend..."
if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    echo "📋 Build error details:"
    cat /root/.npm/_logs/*.log | tail -50
    exit 1
fi

# Verify build output
echo "📁 Build output verification:"
ls -la dist/
if [ ! -d "dist" ] || [ -z "$(ls -A dist/)" ]; then
    echo "❌ Build output is empty or missing"
    exit 1
fi

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
