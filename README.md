# Brand Playbook Intelligence App

A powerful tool for processing brand playbooks and providing intelligent Q&A capabilities.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Git

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/tom2tomtomtom/brand-playbook-app.git
cd brand-playbook-app
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OpenAI API key
python main.py
```

3. Set up the frontend (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

4. Access the app at http://localhost:5173

## Features (MVP - Phase 1)
- ✅ Upload PowerPoint and PDF brand playbooks
- ✅ Extract and index content
- ✅ Ask questions about brand guidelines
- ✅ Get relevant passages with answers
- ✅ Simple web interface

## Architecture
- **Backend**: FastAPI + Python
- **Frontend**: React + Vite
- **Vector Store**: ChromaDB
- **LLM**: OpenAI GPT-4

## Project Structure
```
brand-playbook-app/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── document_processor.py
│   ├── vector_store.py
│   ├── qa_engine.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   └── package.json
└── README.md
```
