# GitHub Repository Setup Instructions

## Initial Setup

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name: `brand-playbook-app`
   - Description: "AI-powered Brand Playbook Intelligence App"
   - Make it Private or Public as needed
   - Don't initialize with README (we already have one)

2. **Push the code to GitHub:**

```bash
cd /tmp/brand-playbook-app

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Brand Playbook Intelligence App MVP"

# Add your GitHub repository as origin
git remote add origin https://github.com/tom2tomtomtom/brand-playbook-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Setting up GitHub Secrets (for CI/CD)

1. Go to your repository on GitHub
2. Click on Settings → Secrets and variables → Actions
3. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key

## Next Steps

After pushing to GitHub:

1. **Local Development:**
   ```bash
   git clone https://github.com/tom2tomtomtom/brand-playbook-app.git
   cd brand-playbook-app
   ./setup.sh
   # Add your OpenAI API key to backend/.env
   ./start.sh
   ```

2. **Production Deployment Options:**
   - **Docker**: Use the included docker-compose.yml
   - **Heroku**: Add Heroku buildpacks for Python and Node.js
   - **AWS/GCP/Azure**: Deploy using container services
   - **Vercel**: Deploy frontend separately to Vercel
   - **Railway/Render**: Easy deployment with included Dockerfiles

## Important Notes

- Never commit your `.env` file with real API keys
- The `.gitignore` file is already configured properly
- Make sure to set up environment variables in your deployment platform
- Consider adding rate limiting for production use
