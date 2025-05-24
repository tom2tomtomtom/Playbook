# Brand Playbook Intelligence App

A powerful AI-powered tool for processing brand playbooks and providing intelligent Q&A capabilities with advanced features including authentication, rate limiting, and comprehensive document processing.

## Features

### Core Features (MVP)
- ✅ Upload PowerPoint, PDF, and Word brand playbooks
- ✅ Advanced document processing with table and image extraction
- ✅ Intelligent Q&A with GPT-4
- ✅ Semantic search with relevance scoring
- ✅ Conversation history and context awareness
- ✅ Follow-up question suggestions

### Security & Performance
- 🔐 JWT-based authentication
- 🚦 Rate limiting to prevent abuse
- 📊 Token usage tracking and cost monitoring
- 🔄 Retry logic for API calls
- 📝 Comprehensive logging
- ⚡ Batch processing for embeddings

### User Experience
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔔 Real-time notifications with react-hot-toast
- 📈 Upload progress tracking
- 🔍 Document search and filtering
- 📄 Pagination for large datasets
- 💬 Interactive conversation interface

## Architecture

- **Backend**: FastAPI + Python 3.9+
- **Frontend**: React + TypeScript + Vite
- **Vector Store**: ChromaDB
- **LLM**: OpenAI GPT-4
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git
- OpenAI API key

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/tom2tomtomtom/Playbook.git
cd Playbook
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
   - Default login: admin / admin123

## Docker Deployment

```bash
# Set environment variables
export OPENAI_API_KEY=your-key-here
export SECRET_KEY=your-secret-key

# Run with Docker Compose
docker-compose up -d
```

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/api/v2/docs
- ReDoc: http://localhost:8000/api/v2/redoc

## Configuration

### Backend (.env)
```env
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
MAX_UPLOAD_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=pdf,pptx,ppt,docx,doc

# Rate Limiting
RATE_LIMIT=10/minute
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v2
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Type Checking
```bash
cd frontend
npm run type-check
```

## Project Structure
```
Playbook/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── auth.py              # Authentication logic
│   ├── logger.py            # Logging configuration
│   ├── document_processor.py # Advanced document processing
│   ├── vector_store.py      # ChromaDB integration
│   ├── qa_engine.py         # Q&A engine with GPT-4
│   ├── requirements.txt     # Python dependencies
│   └── tests/               # Unit tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   └── types/           # TypeScript types
│   └── package.json         # Node dependencies
├── docker-compose.yml       # Docker configuration
└── README.md               # This file
```

## Advanced Features

### Document Processing
- Extracts text, tables, and images from PDFs
- Handles PowerPoint slides with speaker notes
- Processes Word documents with formatting preservation
- Intelligent chunking with overlap for context

### Vector Search
- Semantic search using OpenAI embeddings
- Relevance scoring and filtering
- Metadata-based filtering
- Efficient batch processing

### Q&A Engine
- Context-aware responses
- Conversation history support
- Follow-up question generation
- Confidence scoring
- Source attribution

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the test files for usage examples
