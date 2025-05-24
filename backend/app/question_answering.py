"""Question answering module using LLM and vector search."""
import os
from typing import List, Dict, Any
import openai
from openai import OpenAI
import asyncio
from .vector_store import VectorStore

class QuestionAnswering:
    """Handles question answering using retrieval-augmented generation."""
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def answer_question(
        self, 
        question: str, 
        document_id: str = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """Answer a question using relevant passages from the brand playbook."""
        
        # Search for relevant passages
        passages = await self.vector_store.search(question, document_id, top_k)
        
        if not passages:
            return {
                "answer": "I couldn't find relevant information in the brand playbook to answer your question.",
                "confidence": 0.0,
                "passages": []
            }
        
        # Generate answer using LLM
        answer_data = await self._generate_answer(question, passages)
        
        # Format passages for response
        formatted_passages = []
        for passage in passages:
            formatted_passages.append({
                "text": passage["text"],
                "source": passage["metadata"].get("source", "Unknown"),
                "relevance_score": passage["relevance_score"],
                "document_id": passage["metadata"].get("document_id"),
                "highlighted_text": self._highlight_relevant_text(passage["text"], question)
            })
        
        return {
            "answer": answer_data["answer"],
            "confidence": answer_data["confidence"],
            "passages": formatted_passages
        }
    
    async def _generate_answer(self, question: str, passages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate answer using OpenAI GPT model."""
        
        # Prepare context from passages
        context = self._prepare_context(passages)
        
        # Create prompt
        prompt = f"""You are an AI assistant specializing in brand guidelines and playbooks. 
        Answer the following question based ONLY on the provided context from the brand playbook.
        If the information isn't in the context, say so clearly.
        
        Context from brand playbook:
        {context}
        
        Question: {question}
        
        Provide a clear, concise answer and indicate your confidence level (0-1) in the accuracy of your response."""
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a brand expert assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            answer_text = response.choices[0].message.content
            
            # Extract confidence from response (you might want to use a more sophisticated approach)
            confidence = self._extract_confidence(answer_text, passages)
            
            return {
                "answer": answer_text,
                "confidence": confidence
            }
            
        except Exception as e:
            print(f"Error generating answer: {str(e)}")
            return {
                "answer": "I encountered an error while processing your question. Please try again.",
                "confidence": 0.0
            }
    
    def _prepare_context(self, passages: List[Dict[str, Any]]) -> str:
        """Prepare context from retrieved passages."""
        context_parts = []
        
        for i, passage in enumerate(passages[:5]):  # Limit to top 5 passages
            source = passage["metadata"].get("source", "Unknown")
            text = passage["text"]
            context_parts.append(f"[{source}]: {text}")
        
        return "\n\n".join(context_parts)
    
    def _extract_confidence(self, answer: str, passages: List[Dict[str, Any]]) -> float:
        """Extract or calculate confidence score."""
        # Simple heuristic based on passage relevance scores
        if not passages:
            return 0.0
        
        # Average of top 3 passage relevance scores
        top_scores = [p["relevance_score"] for p in passages[:3]]
        avg_score = sum(top_scores) / len(top_scores)
        
        # Adjust based on answer characteristics
        if "I couldn't find" in answer or "not in the context" in answer:
            return max(0.2, avg_score * 0.5)
        
        return min(0.95, avg_score)
    
    def _highlight_relevant_text(self, text: str, question: str) -> str:
        """Highlight parts of text relevant to the question."""
        # Simple keyword highlighting (can be improved with more sophisticated NLP)
        question_words = set(question.lower().split())
        words = text.split()
        highlighted = []
        
        for word in words:
            if word.lower().strip('.,!?;:') in question_words:
                highlighted.append(f"**{word}**")
            else:
                highlighted.append(word)
        
        return " ".join(highlighted)
