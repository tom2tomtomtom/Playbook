#!/bin/bash

# Quick push to GitHub - preconfigured for your repo

cd /tmp/brand-playbook-app

# Initialize git
git init

# Add all files
git add .

# Create commit
git commit -m "Initial commit: Brand Playbook Intelligence App MVP" --allow-empty

# Add your specific repository
git remote add origin https://github.com/tom2tomtomtom/Playbook.git 2>/dev/null || git remote set-url origin https://github.com/tom2tomtomtom/Playbook.git

# Push to GitHub
echo "🚀 Pushing to https://github.com/tom2tomtomtom/Playbook.git"
echo "📝 You'll be prompted for your GitHub username and password/token"
git branch -M main
git push -u origin main --force

echo "✅ Done! Check your repository at https://github.com/tom2tomtomtom/Playbook"
