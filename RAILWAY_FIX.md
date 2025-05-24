# Railway Deployment Fix

## Quick Fix Steps:

### Option 1: Set Root Directory (Recommended)

1. In your Railway project dashboard
2. Go to **Settings** → **General**
3. Set **Root Directory** to: `backend`
4. Click **Save**
5. Trigger a new deployment

### Option 2: Environment Variable Fix

Add these environment variables in Railway:

```
PORT=8000
SECRET_KEY=your-secret-key-here
FRONTEND_URL=https://your-app.netlify.app
RAILWAY_RUN_UID=0
```

### Option 3: Use Render Instead (Easiest)

If Railway continues to have issues:

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Use these settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `SECRET_KEY` = (click Generate)
   - `FRONTEND_URL` = your-netlify-url

## Manual Railway Commands

If you're using Railway CLI:

```bash
# Link to your project
railway link

# Set root directory
railway variables set RAILWAY_DOCKERFILE_PATH=backend/Dockerfile

# Deploy
railway up
```

## The issue explained:

Railway expects files in the root directory, but our backend is in a subdirectory. The fixes above tell Railway where to find the backend files.
