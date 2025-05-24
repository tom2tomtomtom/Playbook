import chromadb
from chromadb.config import Settings
import openai
from typing import List, Dict, Optional, Tuple
import os
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from document_processor import DocumentChunk
from config import settings
import hashlib
import json

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Initialize OpenAI
        openai.api_key = settings.openai_api_key
        self.embedding_model = settings.embedding_model
        
        # Get or create collections
        self.collection = self.client.get_or_create_collection(
            name="brand_playbooks",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Metadata collection for efficient playbook listing
        self.metadata_collection = self.client.get_or_create_collection(
            name="playbook_metadata",
            metadata={"hnsw:space": "cosine"}
        )
        
        logger.info("VectorStore initialized successfully")
    
    def add_documents(self, playbook_id: str, chunks: List[DocumentChunk], metadata: Optional[Dict] = None):
        """Add document chunks to the vector store with improved batching"""
        if not chunks:
            logger.warning(f"No chunks to add for playbook {playbook_id}")
            return
        
        logger.info(f"Adding {len(chunks)} chunks for playbook {playbook_id}")
        
        # Prepare data for insertion
        documents = []
        metadatas = []
        ids = []
        
        for i, chunk in enumerate(chunks):
            documents.append(chunk.content)
            
            chunk_metadata = {
                "playbook_id": playbook_id,
                "page_number": chunk.page_number,
                "chunk_type": chunk.chunk_type,
                **chunk.metadata
            }
            metadatas.append(chunk_metadata)
            
            # Create unique ID for each chunk using content hash
            content_hash = hashlib.md5(chunk.content.encode()).hexdigest()[:8]
            chunk_id = f"{playbook_id}_{i}_{content_hash}"
            ids.append(chunk_id)
        
        # Get embeddings in batches
        embeddings = self._get_embeddings_batch(documents)
        
        # Add to ChromaDB in batches
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch_end = min(i + batch_size, len(documents))
            
            try:
                self.collection.add(
                    documents=documents[i:batch_end],
                    embeddings=embeddings[i:batch_end],
                    metadatas=metadatas[i:batch_end],
                    ids=ids[i:batch_end]
                )
                logger.info(f"Added batch {i//batch_size + 1} of {(len(documents)-1)//batch_size + 1}")
            except Exception as e:
                logger.error(f"Error adding batch {i//batch_size + 1}: {e}")
                raise
        
        # Store playbook metadata
        self._store_playbook_metadata(playbook_id, metadata or {})
        
        logger.info(f"Successfully added all chunks for playbook {playbook_id}")

    def search(self, query: str, playbook_id: Optional[str] = None, 
              top_k: int = 5, score_threshold: float = 0.7) -> List[Dict]:
        """Search for relevant passages with score threshold"""
        logger.info(f"Searching for: '{query}' in playbook: {playbook_id or 'all'}")
        
        # Get query embedding
        query_embedding = self._get_embeddings_batch([query])[0]
        
        # Build where clause
        where = {}
        if playbook_id:
            where["playbook_id"] = playbook_id
        
        # Search in ChromaDB
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k * 2,  # Get more results for filtering
                where=where if where else None,
                include=["documents", "metadatas", "distances"]
            )
        except Exception as e:
            logger.error(f"Error searching ChromaDB: {e}")
            raise
        
        # Format and filter results
        passages = []
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                score = 1 - results['distances'][0][i]  # Convert distance to similarity
                
                # Filter by score threshold
                if score >= score_threshold:
                    passages.append({
                        "content": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "score": score
                    })
        
        # Return top_k results after filtering
        passages = sorted(passages, key=lambda x: x['score'], reverse=True)[:top_k]
        
        logger.info(f"Found {len(passages)} relevant passages")
        return passages
    
    def list_playbooks(self, page: int = 1, page_size: int = 10) -> Dict[str, any]:
        """List all playbooks with pagination"""
        try:
            # Get all playbook metadata
            all_metadata = self.metadata_collection.get()
            
            playbooks = []
            if all_metadata['metadatas']:
                for i, metadata in enumerate(all_metadata['metadatas']):
                    playbooks.append({
                        "id": all_metadata['ids'][i].replace("_metadata", ""),
                        **metadata
                    })
            
            # Apply pagination
            total = len(playbooks)
            start = (page - 1) * page_size
            end = start + page_size
            
            return {
                "playbooks": playbooks[start:end],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        except Exception as e:
            logger.error(f"Error listing playbooks: {e}")
            raise
    
    def delete_playbook(self, playbook_id: str):
        """Delete all chunks and metadata associated with a playbook"""
        logger.info(f"Deleting playbook: {playbook_id}")
        
        try:
            # Delete document chunks
            results = self.collection.get(
                where={"playbook_id": playbook_id}
            )
            
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} chunks")
            
            # Delete metadata
            self.metadata_collection.delete(ids=[f"{playbook_id}_metadata"])
            
            logger.info(f"Successfully deleted playbook: {playbook_id}")
        except Exception as e:
            logger.error(f"Error deleting playbook {playbook_id}: {e}")
            raise
    
    def get_playbook_info(self, playbook_id: str) -> Optional[Dict]:
        """Get metadata for a specific playbook"""
        try:
            result = self.metadata_collection.get(
                ids=[f"{playbook_id}_metadata"]
            )
            
            if result['metadatas'] and len(result['metadatas']) > 0:
                return result['metadatas'][0]
            return None
        except Exception as e:
            logger.error(f"Error getting playbook info: {e}")
            return None
    
    def _store_playbook_metadata(self, playbook_id: str, metadata: Dict):
        """Store playbook metadata for efficient retrieval"""
        try:
            # Add timestamp and chunk count
            chunks_result = self.collection.get(
                where={"playbook_id": playbook_id}
            )
            
            metadata.update({
                "created_at": metadata.get("created_at", ""),
                "chunk_count": len(chunks_result['ids']) if chunks_result['ids'] else 0
            })
            
            # Create a simple embedding for metadata (just zeros)
            dummy_embedding = [0.0] * 1536  # Ada-002 embedding size
            
            self.metadata_collection.upsert(
                ids=[f"{playbook_id}_metadata"],
                embeddings=[dummy_embedding],
                metadatas=[metadata],
                documents=[json.dumps(metadata)]
            )
        except Exception as e:
            logger.error(f"Error storing playbook metadata: {e}")
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings from OpenAI with batching and retry logic"""
        embeddings = []
        batch_size = 100  # OpenAI recommended batch size
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                logger.debug(f"Getting embeddings for batch {i//batch_size + 1}")
                response = openai.embeddings.create(
                    model=self.embedding_model,
                    input=batch
                )
                
                batch_embeddings = [embedding.embedding for embedding in response.data]
                embeddings.extend(batch_embeddings)
                
                # Log token usage
                if hasattr(response, 'usage'):
                    logger.info(f"Embedding tokens used: {response.usage.total_tokens}")
                    
            except Exception as e:
                logger.error(f"Error getting embeddings for batch {i//batch_size + 1}: {e}")
                raise
        
        return embeddings
    
    def get_statistics(self) -> Dict[str, any]:
        """Get vector store statistics"""
        try:
            # Get collection stats
            collection_count = self.collection.count()
            metadata_count = self.metadata_collection.count()
            
            # Get unique playbooks
            all_docs = self.collection.get()
            unique_playbooks = set()
            
            if all_docs['metadatas']:
                for metadata in all_docs['metadatas']:
                    if 'playbook_id' in metadata:
                        unique_playbooks.add(metadata['playbook_id'])
            
            return {
                "total_chunks": collection_count,
                "total_playbooks": len(unique_playbooks),
                "metadata_entries": metadata_count,
                "embedding_model": self.embedding_model
            }
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {
                "error": str(e),
                "total_chunks": 0,
                "total_playbooks": 0
            }
