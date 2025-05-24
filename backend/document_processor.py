import os
from typing import List, Dict
import PyPDF2
from pptx import Presentation
from dataclasses import dataclass
import re

@dataclass
class DocumentChunk:
    content: str
    page_number: int
    chunk_type: str  # 'text', 'table', 'title', etc.
    metadata: Dict

class DocumentProcessor:
    def __init__(self):
        self.chunk_size = 500  # words per chunk
        self.chunk_overlap = 50  # words overlap between chunks
    
    def process_document(self, file_path: str, file_type: str) -> List[DocumentChunk]:
        """Process a document and return chunks of content"""
        if file_type in ['pdf']:
            return self.process_pdf(file_path)
        elif file_type in ['pptx', 'ppt']:
            return self.process_powerpoint(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def process_pdf(self, file_path: str) -> List[DocumentChunk]:
        """Extract content from PDF files"""
        chunks = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    text = page.extract_text()
                    if text.strip():
                        # Split into chunks
                        page_chunks = self._create_chunks(
                            text, 
                            page_num + 1, 
                            'pdf_text'
                        )
                        chunks.extend(page_chunks)
                except Exception as e:
                    print(f"Error processing page {page_num}: {e}")
                    continue
        
        return chunks

    def process_powerpoint(self, file_path: str) -> List[DocumentChunk]:
        """Extract content from PowerPoint files"""
        chunks = []
        presentation = Presentation(file_path)
        
        for slide_num, slide in enumerate(presentation.slides):
            slide_content = []
            
            # Extract slide title
            if slide.shapes.title:
                title = slide.shapes.title.text
                if title:
                    chunks.append(DocumentChunk(
                        content=title,
                        page_number=slide_num + 1,
                        chunk_type='title',
                        metadata={'slide_number': slide_num + 1}
                    ))
            
            # Extract text from shapes
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text:
                    slide_content.append(shape.text)
            
            # Extract notes
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame.text:
                slide_content.append(f"Notes: {slide.notes_slide.notes_text_frame.text}")
            
            # Create chunks from slide content
            if slide_content:
                full_text = "\n".join(slide_content)
                slide_chunks = self._create_chunks(
                    full_text,
                    slide_num + 1,
                    'slide_content'
                )
                chunks.extend(slide_chunks)
        
        return chunks
    
    def _create_chunks(self, text: str, page_number: int, chunk_type: str) -> List[DocumentChunk]:
        """Split text into overlapping chunks"""
        chunks = []
        words = text.split()
        
        if len(words) <= self.chunk_size:
            # If text is small enough, return as single chunk
            chunks.append(DocumentChunk(
                content=text,
                page_number=page_number,
                chunk_type=chunk_type,
                metadata={'word_count': len(words)}
            ))
            return chunks
        
        # Create overlapping chunks
        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = " ".join(chunk_words)
            
            chunks.append(DocumentChunk(
                content=chunk_text,
                page_number=page_number,
                chunk_type=chunk_type,
                metadata={
                    'word_count': len(chunk_words),
                    'chunk_index': i // (self.chunk_size - self.chunk_overlap)
                }
            ))
            
            if i + self.chunk_size >= len(words):
                break
        
        return chunks
    
    def extract_tables(self, text: str) -> List[Dict]:
        """Extract table-like content from text (basic implementation)"""
        # This is a placeholder for more sophisticated table extraction
        # In a production system, you'd use more advanced techniques
        tables = []
        lines = text.split('\n')
        
        # Simple heuristic: look for lines with multiple tabs or pipes
        for i, line in enumerate(lines):
            if '\t' in line or '|' in line:
                # Potential table row
                tables.append({
                    'line_number': i,
                    'content': line,
                    'type': 'potential_table_row'
                })
        
        return tables
