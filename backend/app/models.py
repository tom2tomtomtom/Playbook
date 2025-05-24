"""Pydantic models for request/response validation"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request Models
class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    playbook_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the brand colors?",
                "playbook_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

class LoginRequest(BaseModel):
    username: str
    password: str

# Response Models
class Passage(BaseModel):
    content: str
    page_number: int
    chunk_type: str
    score: float

class QuestionResponse(BaseModel):
    answer: str
    passages: List[Passage]
    confidence: float
    tokens_used: int
    follow_up_questions: List[str] = []

class UploadResponse(BaseModel):
    playbook_id: str
    filename: str
    status: str
    message: str
    chunk_count: int

class PlaybookInfo(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    uploaded_by: str
    created_at: str
    chunk_count: int

class PlaybookListResponse(BaseModel):
    playbooks: List[PlaybookInfo]
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

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class SummaryResponse(BaseModel):
    summary: str
    key_sections: List[str]

class StatisticsResponse(BaseModel):
    vector_store: Dict[str, Any]
    token_usage: Dict[str, Any]
    api_version: str

class ErrorResponse(BaseModel):
    detail: str
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
