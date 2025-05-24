from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    # API Configuration
    api_title: str = "Brand Playbook Intelligence API"
    api_version: str = "2.0.0"
    api_prefix: str = "/api/v2"
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = "gpt-4-turbo-preview"
    embedding_model: str = "text-embedding-ada-002"
    
    # ChromaDB
    chroma_persist_directory: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
    
    # File Upload
    upload_directory: str = os.getenv("UPLOAD_DIRECTORY", "./uploads")
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: List[str] = ["pdf", "pptx", "ppt", "docx", "doc"]
    
    # Frontend
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Document Processing
    chunk_size: int = 500
    chunk_overlap: int = 50
    
    # Rate Limiting
    rate_limit: str = "10/minute"
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
