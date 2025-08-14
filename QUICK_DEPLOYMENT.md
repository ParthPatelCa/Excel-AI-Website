# Quick Deployment Guide

## 🚀 Deploy Frontend to Vercel (5 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure build settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy!**

## 🔧 Deploy Backend to Railway (5 minutes)

1. **Go to [railway.app](https://railway.app)**
2. **Create new project from GitHub**
3. **Select your repository**
4. **Railway will automatically detect the configuration**
5. **Set environment variables:**
   ```bash
   FLASK_ENV=production
   FLASK_SECRET_KEY=your-secret-key
   OPENAI_API_KEY=your-openai-key
   ```
6. **Deploy!**

## 🔗 Connect Frontend to Backend

1. **Get your Railway backend URL** (e.g., `https://your-app.railway.app`)
2. **In Vercel, set environment variable:**
   ```bash
   VITE_API_BASE_URL=https://your-app.railway.app/api
   ```
3. **Redeploy frontend**

## ✅ Done!

- **Frontend**: Served from Vercel CDN (fast, reliable)
- **Backend**: Running on Railway (no build issues)
- **No more exit code 137 errors!**

## 🆘 If Railway Still Fails

Use the ultra-simple configuration:
```bash
# Rename railway-simple.toml to railway.toml
mv railway-simple.toml railway.toml
```

This configuration only builds the backend and should work reliably.