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
- 🆕 **User-provided API keys** - Users can use their own OpenAI API keys

### Security & Performance
- 🔐 JWT-based authentication
- 🚦 Rate limiting to prevent abuse
- 📊 Token usage tracking and cost monitoring
- 🔄 Retry logic for API calls
- 📝 Comprehensive logging
- ⚡ Batch processing for embeddings
- 🔑 Support for user-provided OpenAI API keys

### User Experience
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔔 Real-time notifications with react-hot-toast
- 🔍 API key management interface
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
- OpenAI API key (optional - users can provide their own)

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
# Edit .env - OpenAI API key is optional
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
   - You'll be prompted to enter your OpenAI API key on first use

## API Key Management

The application supports two modes for OpenAI API keys:

### 1. Server-side API Key (Default)
Set your OpenAI API key in the backend `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 2. User-provided API Keys (Recommended)
Users can provide their own OpenAI API keys through the UI:
- Click the "Settings" button in the header
- Enter your OpenAI API key
- The key is validated before being accepted
- Keys are stored only in the browser's session storage
- Keys are sent directly to OpenAI, never stored on the server

**Benefits of user-provided keys:**
- Users control their own API costs
- No shared API key limits
- Enhanced privacy and security
- Keys persist only for the browser session

## Docker Deployment

```bash
# Set environment variables (API key is optional)
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
# OpenAI (Optional - users can provide their own)
OPENAI_API_KEY=your-openai-api-key-or-leave-empty

# Security (Required)
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

## API Endpoints

### Authentication
- `POST /api/v2/auth/login` - User login
- `POST /api/v2/validate-api-key` - Validate OpenAI API key

### Playbook Management
- `POST /api/v2/upload` - Upload a playbook (requires API key)
- `GET /api/v2/playbooks` - List all playbooks
- `GET /api/v2/playbooks/{id}` - Get playbook details
- `DELETE /api/v2/playbooks/{id}` - Delete a playbook
- `GET /api/v2/playbooks/{id}/summary` - Generate playbook summary

### Q&A
- `POST /api/v2/ask` - Ask a question (requires API key)

### System
- `GET /api/v2/health` - Health check
- `GET /api/v2/stats` - Usage statistics

**Note:** Endpoints marked with "requires API key" need either:
- A server-side API key configured in `.env`, OR
- A user-provided API key sent via `X-API-Key` header

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
│   │   │   └── ApiKeySettings.tsx # API key management
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

### API Key Features
- Validate API keys before use
- Support for GPT-4 and GPT-3.5 models
- Per-session key storage
- Cost tracking per API key
- Automatic model selection based on key permissions

## Security Considerations

### API Key Security
- User API keys are stored only in browser session storage
- Keys are transmitted via secure HTTPS headers
- Server never logs or stores user API keys
- Each user's API calls are isolated

### General Security
- JWT tokens for authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS properly configured

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

## Troubleshooting

### "No API Key" Error
- Ensure you've either:
  - Set an API key in the Settings modal, OR
  - Configured `OPENAI_API_KEY` in backend `.env`

### Invalid API Key
- Verify your key starts with `sk-`
- Check your OpenAI account for API access
- Ensure your key has appropriate permissions

### Rate Limiting
- Default: 10 requests per minute
- Adjust in backend `.env` if needed
