from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Annotated
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import shutil

# Import configuration and modules
from config import settings
from logger import logger
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    Token, User
)
from document_processor import DocumentProcessor
from vector_store import VectorStore
from qa_engine import QAEngine

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc"
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
doc_processor = DocumentProcessor(
    chunk_size=settings.chunk_size,
    chunk_overlap=settings.chunk_overlap
)

# Ensure upload directory exists
os.makedirs(settings.upload_directory, exist_ok=True)

# Request/Response models
class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    playbook_id: Optional[str] = None
    conversation_history: Optional[List[Dict]] = None

class QuestionResponse(BaseModel):
    answer: str
    passages: List[dict]
    confidence: float
    tokens_used: int
    follow_up_questions: List[str] = []

class UploadResponse(BaseModel):
    playbook_id: str
    filename: str
    status: str
    message: str
    chunk_count: int

class PlaybookListResponse(BaseModel):
    playbooks: List[Dict]
    total: int
    page: int
    page_size: int
    total_pages: int

class HealthResponse(BaseModel):
    status: str
    version: str
    vector_store_status: str
    total_playbooks: int
    total_chunks: int

class ApiKeyValidationResponse(BaseModel):
    valid: bool
    message: str
    model: Optional[str] = None

# Helper function to get API key
def get_api_key(x_api_key: Annotated[Optional[str], Header()] = None) -> Optional[str]:
    """Get API key from header or fall back to environment variable"""
    if x_api_key:
        return x_api_key
    return settings.openai_api_key

# Authentication endpoint
@app.post(f"{settings.api_prefix}/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return access token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# API Key validation endpoint
@app.post(f"{settings.api_prefix}/validate-api-key", response_model=ApiKeyValidationResponse)
@limiter.limit("10/minute")
async def validate_api_key(
    request: Request,
    api_key: str = Field(..., description="OpenAI API key to validate"),
    current_user: User = Depends(get_current_active_user)
):
    """Validate an OpenAI API key"""
    import openai
    
    try:
        # Test the API key by making a simple request
        client = openai.OpenAI(api_key=api_key)
        models = client.models.list()
        
        # Check if GPT-4 is available
        gpt4_available = any("gpt-4" in model.id for model in models.data)
        model_name = "gpt-4-turbo-preview" if gpt4_available else "gpt-3.5-turbo"
        
        return ApiKeyValidationResponse(
            valid=True,
            message="API key is valid",
            model=model_name
        )
    except Exception as e:
        logger.warning(f"Invalid API key provided: {str(e)}")
        return ApiKeyValidationResponse(
            valid=False,
            message="Invalid API key. Please check your key and try again."
        )

# Health check endpoint
@app.get(f"{settings.api_prefix}/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Initialize vector store with default API key for health check
        vector_store = VectorStore(api_key=settings.openai_api_key)
        stats = vector_store.get_statistics()
        return HealthResponse(
            status="healthy",
            version=settings.api_version,
            vector_store_status="connected",
            total_playbooks=stats.get("total_playbooks", 0),
            total_chunks=stats.get("total_chunks", 0)
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(500, "Service unhealthy")

@app.get("/")
async def root():
    return {
        "message": "Brand Playbook Intelligence API",
        "version": settings.api_version,
        "docs": f"{settings.api_prefix}/docs"
    }

@app.post(f"{settings.api_prefix}/upload", response_model=UploadResponse)
@limiter.limit("5/minute")
async def upload_playbook(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """Upload and process a brand playbook (PDF, PowerPoint, or Word)"""
    if not api_key:
        raise HTTPException(400, "OpenAI API key required. Please provide via X-API-Key header.")
    
    # Validate file size
    file_size = 0
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > settings.max_upload_size:
        raise HTTPException(400, f"File size exceeds maximum allowed size of {settings.max_upload_size // (1024*1024)}MB")
    
    # Reset file pointer
    await file.seek(0)
    
    # Validate file extension
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(400, f"File type not allowed. Allowed types: {settings.allowed_extensions}")
    
    # Generate unique ID for this playbook
    playbook_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_path = os.path.join(settings.upload_directory, f"{playbook_id}.{file_extension}")
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(f"Processing document: {file.filename} (ID: {playbook_id})")
        
        # Process document
        extracted_content = doc_processor.process_document(file_path, file_extension)
        
        # Prepare metadata
        metadata = {
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": file_size,
            "uploaded_by": current_user.username,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in vector database with provided API key
        vector_store = VectorStore(api_key=api_key)
        vector_store.add_documents(playbook_id, extracted_content, metadata)
        
        return UploadResponse(
            playbook_id=playbook_id,
            filename=file.filename,
            status="success",
            message=f"Successfully processed {len(extracted_content)} content chunks",
            chunk_count=len(extracted_content)
        )
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Error processing document: {e}")
        raise HTTPException(500, f"Error processing document: {str(e)}")

@app.post(f"{settings.api_prefix}/ask", response_model=QuestionResponse)
@limiter.limit(settings.rate_limit)
async def ask_question(
    request: Request,
    question_request: QuestionRequest,
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """Ask a question about the brand playbook"""
    if not api_key:
        raise HTTPException(400, "OpenAI API key required. Please provide via X-API-Key header.")
    
    try:
        logger.info(f"User {current_user.username} asking: {question_request.question}")
        
        # Initialize components with provided API key
        vector_store = VectorStore(api_key=api_key)
        qa_engine = QAEngine(vector_store, api_key=api_key)
        
        result = qa_engine.answer_question(
            question=question_request.question,
            playbook_id=question_request.playbook_id,
            conversation_history=question_request.conversation_history
        )
        return result
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(500, f"Error answering question: {str(e)}")

@app.get(f"{settings.api_prefix}/playbooks", response_model=PlaybookListResponse)
@limiter.limit("30/minute")
async def list_playbooks(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """List all uploaded playbooks with pagination"""
    if not api_key:
        api_key = settings.openai_api_key
    
    try:
        if page < 1:
            raise HTTPException(400, "Page must be >= 1")
        if page_size < 1 or page_size > 100:
            raise HTTPException(400, "Page size must be between 1 and 100")
        
        vector_store = VectorStore(api_key=api_key)
        result = vector_store.list_playbooks(page=page, page_size=page_size)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing playbooks: {e}")
        raise HTTPException(500, f"Error listing playbooks: {str(e)}")

@app.get(f"{settings.api_prefix}/playbooks/{{playbook_id}}")
async def get_playbook_info(
    playbook_id: str,
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """Get information about a specific playbook"""
    if not api_key:
        api_key = settings.openai_api_key
    
    try:
        vector_store = VectorStore(api_key=api_key)
        info = vector_store.get_playbook_info(playbook_id)
        if not info:
            raise HTTPException(404, "Playbook not found")
        return info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting playbook info: {e}")
        raise HTTPException(500, f"Error getting playbook info: {str(e)}")

@app.get(f"{settings.api_prefix}/playbooks/{{playbook_id}}/summary")
@limiter.limit("5/minute")
async def get_playbook_summary(
    request: Request,
    playbook_id: str,
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """Generate a summary of a playbook's key points"""
    if not api_key:
        raise HTTPException(400, "OpenAI API key required. Please provide via X-API-Key header.")
    
    try:
        vector_store = VectorStore(api_key=api_key)
        qa_engine = QAEngine(vector_store, api_key=api_key)
        summary = qa_engine.generate_summary(playbook_id)
        return summary
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(500, f"Error generating summary: {str(e)}")

@app.delete(f"{settings.api_prefix}/playbooks/{{playbook_id}}")
async def delete_playbook(
    playbook_id: str,
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """Delete a playbook and its associated data"""
    if not api_key:
        api_key = settings.openai_api_key
    
    try:
        # Check if playbook exists
        vector_store = VectorStore(api_key=api_key)
        info = vector_store.get_playbook_info(playbook_id)
        if not info:
            raise HTTPException(404, "Playbook not found")
        
        # Delete from vector store
        vector_store.delete_playbook(playbook_id)
        
        # Delete uploaded file
        for ext in settings.allowed_extensions:
            file_path = os.path.join(settings.upload_directory, f"{playbook_id}.{ext}")
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
        
        return {"message": "Playbook deleted successfully", "playbook_id": playbook_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting playbook: {e}")
        raise HTTPException(500, f"Error deleting playbook: {str(e)}")

@app.get(f"{settings.api_prefix}/stats")
async def get_statistics(
    current_user: User = Depends(get_current_active_user),
    api_key: Optional[str] = Depends(get_api_key)
):
    """Get system statistics and usage metrics"""
    if not api_key:
        api_key = settings.openai_api_key
    
    try:
        vector_store = VectorStore(api_key=api_key)
        qa_engine = QAEngine(vector_store, api_key=api_key)
        
        vector_stats = vector_store.get_statistics()
        token_usage = qa_engine.get_token_usage_report()
        
        return {
            "vector_store": vector_stats,
            "token_usage": token_usage,
            "api_version": settings.api_version
        }
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(500, f"Error getting statistics: {str(e)}")

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.error(f"ValueError: {exc}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."}
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.api_title} v{settings.api_version}")
    logger.info(f"Upload directory: {settings.upload_directory}")
    logger.info(f"ChromaDB directory: {settings.chroma_persist_directory}")
    
    # Create necessary directories
    Path(settings.upload_directory).mkdir(parents=True, exist_ok=True)
    Path(settings.chroma_persist_directory).mkdir(parents=True, exist_ok=True)
    Path("logs").mkdir(exist_ok=True)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None  # Use our custom logging
    )
