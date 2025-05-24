#!/bin/bash

# Start script for Brand Playbook Intelligence App

echo "🚀 Starting Brand Playbook Intelligence App..."

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env not found. Please run ./setup.sh first"
    exit 1
fi

# Check if OPENAI_API_KEY is set in .env
if ! grep -q "OPENAI_API_KEY=sk-" backend/.env; then
    echo "⚠️  Warning: OpenAI API key not set in backend/.env"
    echo "Please add your API key before using the app"
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend
source venv/bin/activate || venv\Scripts\activate  # Windows compatibility
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Application started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the application"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID" INT
wait
