#!/bin/bash

# Easy deployment script for Brand Playbook Intelligence

echo "🚀 Easy Deployment Script for Brand Playbook Intelligence"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    curl -fsSL https://railway.app/install.sh | sh
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

echo ""
echo "🔐 First, let's generate a secure secret key..."
SECRET_KEY=$(openssl rand -base64 32)
echo "Generated SECRET_KEY: $SECRET_KEY"
echo ""

# Deploy Backend
echo "🚂 Deploying Backend to Railway..."
echo "Please login to Railway if prompted."
cd backend
railway login
railway link
railway up
railway variables set SECRET_KEY="$SECRET_KEY"
railway variables set FRONTEND_URL="https://localhost:5173"

# Get backend URL
echo ""
echo "⏳ Waiting for backend deployment..."
sleep 10
BACKEND_URL=$(railway status --json | jq -r .url)
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy Frontend
echo ""
echo "🌐 Deploying Frontend to Netlify..."
cd ../frontend

# Update production env
echo "VITE_API_URL=${BACKEND_URL}/api/v2" > .env.production

# Build and deploy
npm install
npm run build
netlify login
netlify deploy --prod --dir=dist

echo ""
echo "✅ Deployment Complete!"
echo "Backend: $BACKEND_URL"
echo "Frontend: Check Netlify dashboard for URL"
echo ""
echo "⚠️  Don't forget to:"
echo "1. Update FRONTEND_URL in Railway with your Netlify URL"
echo "2. Test the application"
echo "3. Change the admin password in production!"
