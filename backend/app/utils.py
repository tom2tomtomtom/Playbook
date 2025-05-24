"""Utility functions for the application"""

import os
import hashlib
from typing import List, Dict, Any
import re
from datetime import datetime
import json

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s\-.,!?;:()\'"]+', '', text)
    return text.strip()

def generate_document_id(content: str) -> str:
    """Generate a unique ID for a document based on its content"""
    return hashlib.md5(content.encode()).hexdigest()

def format_file_size(bytes: int) -> str:
    """Format file size in human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.1f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.1f} PB"

def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """Validate if file has allowed extension"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed_extensions

def create_metadata(filename: str, file_size: int, user: str, **kwargs) -> Dict[str, Any]:
    """Create metadata dictionary for a document"""
    metadata = {
        "filename": filename,
        "file_size": file_size,
        "file_size_formatted": format_file_size(file_size),
        "uploaded_by": user,
        "created_at": datetime.utcnow().isoformat(),
        "version": "1.0"
    }
    metadata.update(kwargs)
    return metadata

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """Extract keywords from text using simple frequency analysis"""
    # Simple stopwords
    stopwords = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
        'it', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
        'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where',
        'why', 'how', 'not', 'no', 'yes'
    }
    
    # Clean and tokenize
    words = clean_text(text.lower()).split()
    
    # Count word frequency
    word_freq = {}
    for word in words:
        if len(word) > 3 and word not in stopwords:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency and return top keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_words[:max_keywords]]

def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split a list into chunks of specified size"""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """Safely load JSON with default value on error"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default

def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """Calculate estimated reading time in minutes"""
    word_count = len(text.split())
    return max(1, round(word_count / words_per_minute))

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal"""
    # Remove any path separators
    filename = os.path.basename(filename)
    # Remove potentially dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    return name + ext
