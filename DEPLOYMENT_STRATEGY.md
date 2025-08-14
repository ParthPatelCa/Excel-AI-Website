# New Deployment Strategy

## Problem
Railway is consistently failing with exit code 137 (memory constraints) when trying to build the full-stack application.

## Solution: Separate Frontend & Backend Deployments

### Option 1: Frontend on Vercel + Backend on Railway (Recommended)

#### Frontend Deployment (Vercel)
- **Why Vercel**: Excellent for React apps, automatic builds, CDN
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment**: Production-ready with automatic optimization

#### Backend Deployment (Railway)
- **Why Railway**: Good for Python/Flask apps, simpler backend-only builds
- **Build Command**: Only install Python dependencies
- **No Frontend Build**: Backend serves pre-built static files from Vercel

### Option 2: Frontend on Netlify + Backend on Railway

#### Frontend Deployment (Netlify)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment**: Similar to Vercel, good for static sites

#### Backend Deployment (Railway)
- **Same as Option 1**: Backend-only deployment

### Option 3: Frontend on GitHub Pages + Backend on Railway

#### Frontend Deployment (GitHub Pages)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment**: Free, integrated with GitHub

#### Backend Deployment (Railway)
- **Same as above**: Backend-only deployment

## Implementation Steps

### Step 1: Deploy Frontend to Vercel
1. Connect repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy

### Step 2: Deploy Backend to Railway
1. Use `railway-simple.toml` configuration
2. Backend-only build (no frontend compilation)
3. Set environment variables
4. Deploy

### Step 3: Configure CORS and API Endpoints
1. Update frontend API base URL to point to Railway backend
2. Configure CORS in backend for frontend domain
3. Test API connectivity

## Benefits of This Approach

✅ **No More Build Failures**: Railway only builds backend  
✅ **Faster Deployments**: Separate build processes  
✅ **Better Performance**: Frontend served from CDN  
✅ **Scalability**: Each service can scale independently  
✅ **Cost Effective**: Use best service for each part  

## Configuration Files

### For Vercel Frontend
- `vercel.json` (already exists)
- `excel-ai-frontend/package.json` (already optimized)

### For Railway Backend
- `railway-simple.toml` (simplified configuration)
- `excel_ai_backend/` (backend code only)

## Environment Variables

### Frontend (Vercel)
```bash
VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
```

### Backend (Railway)
```bash
FLASK_ENV=production
FLASK_SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
CORS_ORIGINS=https://your-vercel-frontend.vercel.app
```

## Next Steps

1. **Choose deployment option** (Vercel + Railway recommended)
2. **Deploy frontend** to chosen static hosting service
3. **Deploy backend** to Railway using simplified config
4. **Configure CORS** and API endpoints
5. **Test full application**

This approach eliminates the Railway build issues while providing better performance and reliability.