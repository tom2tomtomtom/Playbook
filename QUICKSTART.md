# Quick Start Guide

## Prerequisites
- Python 3.9+
- Node.js 16+
- OpenAI API Key

## Installation

### Option 1: Using Setup Script
```bash
chmod +x setup.sh start.sh
./setup.sh
# Edit backend/.env and add your OpenAI API key
./start.sh
```

### Option 2: Manual Setup

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OpenAI API key
```

2. **Frontend Setup**
```bash
cd frontend
npm install
```

3. **Start the Application**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Option 3: Using Docker
```bash
# Create .env file with OPENAI_API_KEY
echo "OPENAI_API_KEY=your_key_here" > .env
docker-compose up
```

## Usage

1. Open http://localhost:5173 in your browser
2. Upload a PDF or PowerPoint brand playbook
3. Ask questions about the brand guidelines
4. Get AI-powered answers with relevant passages

## API Endpoints

- `POST /api/upload` - Upload a playbook
- `POST /api/ask` - Ask a question
- `GET /api/playbooks` - List all playbooks
- `DELETE /api/playbooks/{id}` - Delete a playbook
