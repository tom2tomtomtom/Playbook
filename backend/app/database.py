"""Database models and configuration."""
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Document(Base):
    """Document metadata model."""
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processing")
    page_count = Column(Integer, nullable=True)
    extracted_text_length = Column(Integer, nullable=True)
    document_type = Column(String, nullable=True)
    brand_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

# Database setup
DATABASE_URL = "sqlite:///./brand_playbook.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
