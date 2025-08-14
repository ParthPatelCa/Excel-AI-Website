# Multi-stage build for production
FROM node:20-alpine as frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY excel-ai-frontend/package*.json ./

# Install dependencies with memory optimization
RUN npm ci --omit=dev --prefer-offline --no-audit --progress=false

COPY excel-ai-frontend/ ./
RUN npm run build

# Python backend
FROM python:3.9-slim as backend

WORKDIR /app

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

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
