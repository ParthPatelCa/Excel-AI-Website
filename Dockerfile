# Multi-stage build for production - Railway optimized
FROM node:20-alpine as frontend-builder

# Set environment variables to reduce memory usage
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV npm_config_cache=/tmp/.npm

# Build frontend
WORKDIR /app/frontend

# Copy package files first for better caching
COPY excel-ai-frontend/package*.json ./

# Install dependencies with memory optimization and fallback
RUN npm install --production --prefer-offline --no-audit --progress=false || \
    npm install --production --prefer-offline --no-audit --progress=false --legacy-peer-deps

# Copy source files
COPY excel-ai-frontend/ ./

# Build frontend
RUN npm run build

# Python backend
FROM python:3.9-slim as backend

WORKDIR /app

# Install system dependencies including curl for health check
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY excel_ai_backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY excel_ai_backend/ ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./src/static/

# Set environment variables
ENV FLASK_APP=src/main.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Use the PORT environment variable for Railway
CMD python -m flask run --host=0.0.0.0 --port=${PORT:-5000}
