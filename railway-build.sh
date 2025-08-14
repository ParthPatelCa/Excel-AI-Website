#!/bin/bash
set -o errexit

echo "🚀 Starting Railway-optimized build..."

# Set memory limits for Railway
export NODE_OPTIONS="--max-old-space-size=1536"
export npm_config_cache=/tmp/.npm

echo "🔧 Installing frontend dependencies..."
cd excel-ai-frontend

# Clean install with memory optimization
npm ci --prefer-offline --no-audit --progress=false --legacy-peer-deps || \
npm install --prefer-offline --no-audit --progress=false --legacy-peer-deps

echo "🏗️ Building frontend with memory optimization..."
npm run build:railway

echo "📦 Installing backend dependencies..."
cd ../excel_ai_backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install --no-cache-dir --disable-pip-version-check -r requirements.txt

echo "📁 Copying frontend build to backend static..."
mkdir -p src/static
cp -r ../excel-ai-frontend/dist/* ./src/static/

echo "✅ Railway build complete!"
echo "🚀 Ready to deploy on Railway!"