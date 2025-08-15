#!/bin/bash
set -o errexit

echo "🔧 Installing frontend dependencies..."
cd excel-ai-frontend
npm install --production=false --prefer-offline --no-audit --verbose

echo "🏗️ Building frontend..."
npm run build

echo "📦 Installing backend dependencies..."
cd ../excel_ai_backend
pip install -r requirements.txt

echo "📁 Copying frontend build to backend static..."
mkdir -p src/static
cp -r ../excel-ai-frontend/dist/* ./src/static/

echo "✅ Build complete!"
