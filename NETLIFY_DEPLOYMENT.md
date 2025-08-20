# Netlify Deployment Configuration

## Current Status
- **Deployment Test Version**: Using AppNoAuth.jsx (no authentication)
- **Purpose**: Test Netlify build process and identify white screen issues

## Environment Variables Needed for Full Version

When ready to restore full authentication, add these to Netlify:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration  
VITE_API_BASE_URL=your-backend-api-url
```

## Build Configuration

Netlify should use:
- **Build Command**: `pnpm install && pnpm run build`
- **Publish Directory**: `dist/`
- **Base Directory**: `excel-ai-frontend/`

## Troubleshooting White Screen

1. **Check Build Logs**: Look for JavaScript errors during build
2. **Environment Variables**: Ensure all required vars are set
3. **Supabase Config**: Verify Supabase client configuration
4. **Import Paths**: Check all @ imports resolve correctly
5. **Dependencies**: Ensure all packages are in package.json

## Deployment Steps

1. **Test Version** (Current): Simple app without auth
2. **Add Environment Variables**: Configure Supabase in Netlify
3. **Restore Full App**: Switch back to App.jsx with authentication
4. **Test Authentication**: Verify login/signup flows work

## Files

- `AppNoAuth.jsx`: Deployment test version (currently active)
- `App.jsx`: Full version with authentication
- `AppSimple.jsx`: Minimal fallback version
- `netlify.toml`: Netlify configuration
