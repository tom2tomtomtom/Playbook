import chromadb
from chromadb.config import Settings
import openai
from typing import List, Dict, Optional
import os
from document_processor import DocumentChunk

class VectorStore:
    def __init__(self):
        # Initialize ChromaDB
        persist_directory = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Initialize OpenAI
        openai.api_key = os.getenv("OPENAI_API_KEY")
        self.embedding_model = "text-embedding-ada-002"
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="brand_playbooks",
            metadata={"hnsw:space": "cosine"}
        )
    
    def add_documents(self, playbook_id: str, chunks: List[DocumentChunk]):
        """Add document chunks to the vector store"""
        if not chunks:
            return
        
        # Prepare data for insertion
        documents = []
        metadatas = []
        ids = []
        
        for i, chunk in enumerate(chunks):
            documents.append(chunk.content)
            
            metadata = {
                "playbook_id": playbook_id,
                "page_number": chunk.page_number,
                "chunk_type": chunk.chunk_type,
                **chunk.metadata
            }
            metadatas.append(metadata)
            
            # Create unique ID for each chunk
            chunk_id = f"{playbook_id}_{i}"
            ids.append(chunk_id)
        
        # Get embeddings
        embeddings = self._get_embeddings(documents)
        
        # Add to ChromaDB
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def search(self, query: str, playbook_id: Optional[str] = None, top_k: int = 5) -> List[Dict]:
        """Search for relevant passages"""
        # Get query embedding
        query_embedding = self._get_embeddings([query])[0]
        
        # Build where clause
        where = {}
        if playbook_id:
            where["playbook_id"] = playbook_id
        
        # Search in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where if where else None,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        passages = []
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                passages.append({
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "score": 1 - results['distances'][0][i]  # Convert distance to similarity
                })
        
        return passages
    
    def list_playbooks(self) -> List[Dict]:
        """List all playbooks in the vector store"""
        # Get all unique playbook IDs
        all_data = self.collection.get()
        playbook_ids = set()
        
        if all_data['metadatas']:
            for metadata in all_data['metadatas']:
                if 'playbook_id' in metadata:
                    playbook_ids.add(metadata['playbook_id'])
        
        return [{"id": pid} for pid in playbook_ids]
    
    def delete_playbook(self, playbook_id: str):
        """Delete all chunks associated with a playbook"""
        # Get all IDs for this playbook
        results = self.collection.get(
            where={"playbook_id": playbook_id}
        )
        
        if results['ids']:
            self.collection.delete(ids=results['ids'])
    
    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings from OpenAI"""
        import openai
        
        # Set API key
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # Get embeddings
        response = openai.embeddings.create(
            model=self.embedding_model,
            input=texts
        )
        
        return [embedding.embedding for embedding in response.data]
