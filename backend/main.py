from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from dotenv import load_dotenv

from document_processor import DocumentProcessor
from vector_store import VectorStore
from qa_engine import QAEngine

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Brand Playbook Intelligence API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
doc_processor = DocumentProcessor()
vector_store = VectorStore()
qa_engine = QAEngine(vector_store)

# Ensure upload directory exists
UPLOAD_DIR = os.getenv("UPLOAD_DIRECTORY", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Request/Response models
class QuestionRequest(BaseModel):
    question: str
    playbook_id: Optional[str] = None

class QuestionResponse(BaseModel):
    answer: str
    passages: List[dict]
    confidence: float

class UploadResponse(BaseModel):
    playbook_id: str
    filename: str
    status: str
    message: str

@app.get("/")
async def root():
    return {"message": "Brand Playbook Intelligence API", "status": "running"}

@app.post("/api/upload", response_model=UploadResponse)
async def upload_playbook(file: UploadFile = File(...)):
    """Upload and process a brand playbook (PDF or PowerPoint)"""
    # Validate file extension
    allowed_extensions = os.getenv("ALLOWED_EXTENSIONS", "pdf,pptx,ppt").split(",")
    file_extension = file.filename.split(".")[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(400, f"File type not allowed. Allowed types: {allowed_extensions}")
    
    # Generate unique ID for this playbook
    playbook_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{playbook_id}.{file_extension}")
    
    try:
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Process document
        extracted_content = doc_processor.process_document(file_path, file_extension)
        
        # Store in vector database
        vector_store.add_documents(playbook_id, extracted_content)
        
        return UploadResponse(
            playbook_id=playbook_id,
            filename=file.filename,
            status="success",
            message=f"Successfully processed {len(extracted_content)} content chunks"
        )
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(500, f"Error processing document: {str(e)}")

@app.post("/api/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about the brand playbook"""
    try:
        result = qa_engine.answer_question(
            question=request.question,
            playbook_id=request.playbook_id
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Error answering question: {str(e)}")

@app.get("/api/playbooks")
async def list_playbooks():
    """List all uploaded playbooks"""
    try:
        playbooks = vector_store.list_playbooks()
        return {"playbooks": playbooks}
    except Exception as e:
        raise HTTPException(500, f"Error listing playbooks: {str(e)}")

@app.delete("/api/playbooks/{playbook_id}")
async def delete_playbook(playbook_id: str):
    """Delete a playbook and its associated data"""
    try:
        vector_store.delete_playbook(playbook_id)
        # Also delete the uploaded file
        for ext in ["pdf", "pptx", "ppt"]:
            file_path = os.path.join(UPLOAD_DIR, f"{playbook_id}.{ext}")
            if os.path.exists(file_path):
                os.remove(file_path)
        return {"message": "Playbook deleted successfully"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting playbook: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
