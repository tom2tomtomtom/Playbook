"""Vector store module using ChromaDB."""
import chromadb
from chromadb.utils import embedding_functions
import os
from typing import List, Dict, Any
import asyncio
from datetime import datetime

class VectorStore:
    """Manages vector embeddings and similarity search using ChromaDB."""
    
    def __init__(self):
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        # Use OpenAI embeddings
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-ada-002"
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="brand_playbooks",
            embedding_function=self.embedding_function,
            metadata={"description": "Brand playbook documents"}
        )
    
    async def add_document(self, document_id: str, extracted_data: Dict[str, Any]) -> None:
        """Add document chunks to vector store."""
        # Prepare chunks from the document
        chunks = self._prepare_chunks(extracted_data)
        
        if not chunks:
            raise ValueError("No content to index")
        
        # Prepare data for ChromaDB
        documents = []
        metadatas = []
        ids = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{i}"
            
            documents.append(chunk["text"])
            metadatas.append({
                "document_id": document_id,
                "chunk_index": i,
                "source": chunk.get("source", ""),
                "page_number": chunk.get("page_number", 0),
                "document_type": extracted_data.get("type", "unknown")
            })
            ids.append(chunk_id)
        
        # Add to ChromaDB in batches
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch_end = min(i + batch_size, len(documents))
            self.collection.add(
                documents=documents[i:batch_end],
                metadatas=metadatas[i:batch_end],
                ids=ids[i:batch_end]
            )
    
    async def search(self, query: str, document_id: str = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant passages."""
        # Build where clause for filtering
        where = {}
        if document_id:
            where["document_id"] = document_id
        
        # Perform search
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where if where else None
        )
        
        # Format results
        passages = []
        if results and results["documents"] and len(results["documents"][0]) > 0:
            for i in range(len(results["documents"][0])):
                passage = {
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i],
                    "relevance_score": 1 - results["distances"][0][i]  # Convert distance to similarity
                }
                passages.append(passage)
        
        return passages
    
    async def delete_document(self, document_id: str) -> None:
        """Delete all chunks for a document."""
        # Get all chunk IDs for this document
        results = self.collection.get(
            where={"document_id": document_id}
        )
        
        if results and results["ids"]:
            self.collection.delete(ids=results["ids"])
    
    def is_healthy(self) -> bool:
        """Check if vector store is operational."""
        try:
            # Try to count documents
            self.collection.count()
            return True
        except Exception:
            return False
    
    def _prepare_chunks(self, extracted_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Prepare document chunks for indexing."""
        chunks = []
        
        if extracted_data["type"] == "powerpoint":
            # Process PowerPoint slides
            for slide in extracted_data.get("slides", []):
                # Title + content as one chunk
                slide_text = []
                
                if slide.get("title"):
                    slide_text.append(f"Slide {slide['slide_number']} Title: {slide['title']}")
                
                for content in slide.get("content", []):
                    slide_text.append(content)
                
                if slide.get("notes"):
                    slide_text.append(f"Speaker Notes: {slide['notes']}")
                
                if slide_text:
                    chunks.append({
                        "text": "\n".join(slide_text),
                        "source": f"Slide {slide['slide_number']}",
                        "page_number": slide['slide_number']
                    })
            
            # Process tables
            for table in extracted_data.get("tables", []):
                table_text = self._format_table(table["data"])
                chunks.append({
                    "text": f"Table from Slide {table['slide_number']}:\n{table_text}",
                    "source": f"Table on Slide {table['slide_number']}",
                    "page_number": table['slide_number']
                })
        
        elif extracted_data["type"] == "pdf":
            # Process PDF pages
            for page in extracted_data.get("pages", []):
                if page["text"].strip():
                    # Split long pages into smaller chunks
                    page_chunks = self._split_text_into_chunks(page["text"])
                    for i, chunk_text in enumerate(page_chunks):
                        chunks.append({
                            "text": chunk_text,
                            "source": f"Page {page['page_number']}",
                            "page_number": page['page_number']
                        })
        
        return chunks
    
    def _split_text_into_chunks(self, text: str, max_chunk_size: int = 1000) -> List[str]:
        """Split text into smaller chunks."""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            word_size = len(word) + 1  # +1 for space
            if current_size + word_size > max_chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_size = word_size
            else:
                current_chunk.append(word)
                current_size += word_size
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _format_table(self, table_data: List[List[str]]) -> str:
        """Format table data as text."""
        if not table_data:
            return ""
        
        formatted_rows = []
        for row in table_data:
            formatted_rows.append(" | ".join(row))
        
        return "\n".join(formatted_rows)
