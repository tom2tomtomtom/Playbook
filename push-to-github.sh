#!/bin/bash

# Git Push Script for Brand Playbook App
# This script will push the code to your GitHub repository

echo "🚀 GitHub Push Script for Brand Playbook App"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: This script must be run from the brand-playbook-app directory"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add all files
echo "📝 Adding all files to Git..."
git add .

# Create commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Brand Playbook Intelligence App MVP

- Complete Phase 1 MVP implementation
- Backend: FastAPI + Python with document processing
- Frontend: React + Vite with modern UI
- Vector search with ChromaDB
- GPT-4 powered Q&A system
- Docker support included"

# Check if remote already exists
if git remote | grep -q "origin"; then
    echo "🔗 Remote 'origin' already exists"
else
    echo ""
    echo "📋 Please enter your GitHub repository URL:"
    echo "   (e.g., https://github.com/tom2tomtomtom/brand-playbook-app.git)"
    read -p "Repository URL: " repo_url
    
    if [ -z "$repo_url" ]; then
        echo "❌ No repository URL provided"
        exit 1
    fi
    
    echo "🔗 Adding remote origin..."
    git remote add origin "$repo_url"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "   (You may be prompted for your GitHub credentials)"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code has been pushed to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Visit your repository on GitHub"
    echo "2. Add a description and topics"
    echo "3. Configure GitHub Secrets for CI/CD (see GITHUB_SETUP.md)"
    echo "4. Consider adding a LICENSE file"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "- Make sure the repository exists on GitHub"
    echo "- Check your GitHub credentials"
    echo "- Ensure you have push access to the repository"
    echo ""
    echo "You can try pushing manually with:"
    echo "  git push -u origin main"
fi
