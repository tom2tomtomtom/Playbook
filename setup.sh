#!/bin/bash

# Setup script for Brand Playbook Intelligence App

echo "🚀 Setting up Brand Playbook Intelligence App..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Setup backend
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate || venv\Scripts\activate  # Windows compatibility
pip install -r requirements.txt

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your OpenAI API key"
fi

# Create necessary directories
mkdir -p uploads chroma_db

cd ..

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend
npm install

cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Edit backend/.env and add your OpenAI API key"
echo "2. Run ./start.sh (or start.bat on Windows)"
