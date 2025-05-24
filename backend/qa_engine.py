import openai
from typing import List, Dict, Optional, Tuple
import os
import logging
from vector_store import VectorStore
from config import settings
from tenacity import retry, stop_after_attempt, wait_exponential
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class QAEngine:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        openai.api_key = settings.openai_api_key
        self.model = settings.openai_model
        self.temperature = 0.5  # Balanced between creativity and accuracy
        
        # Token tracking
        self.token_usage = {
            "total_prompt_tokens": 0,
            "total_completion_tokens": 0,
            "total_cost": 0.0
        }
    
    def answer_question(self, question: str, playbook_id: Optional[str] = None,
                       conversation_history: Optional[List[Dict]] = None) -> Dict:
        """Answer a question using relevant passages from the playbook"""
        logger.info(f"Answering question: '{question}' for playbook: {playbook_id or 'all'}")
        
        # Search for relevant passages
        relevant_passages = self.vector_store.search(
            query=question,
            playbook_id=playbook_id,
            top_k=7,  # Get more passages for better context
            score_threshold=0.6  # Lower threshold to get more context
        )
        
        if not relevant_passages:
            logger.warning("No relevant passages found")
            return {
                "answer": "I couldn't find any relevant information in the brand playbook to answer your question. Please try rephrasing your question or ensure the relevant playbook has been uploaded.",
                "passages": [],
                "confidence": 0.0,
                "tokens_used": 0
            }
        
        # Prepare context from passages
        context = self._prepare_enhanced_context(relevant_passages)
        
        # Generate answer using GPT-4
        answer_data = self._generate_answer(question, context, conversation_history)
        
        # Calculate confidence based on passage scores and answer quality
        confidence = self._calculate_confidence(relevant_passages, answer_data)
        
        # Format response
        response = {
            "answer": answer_data["answer"],
            "passages": self._format_passages(relevant_passages[:3]),  # Return top 3 passages
            "confidence": confidence,
            "tokens_used": answer_data["tokens_used"],
            "follow_up_questions": answer_data.get("follow_up_questions", [])
        }
        
        logger.info(f"Answer generated with confidence: {confidence:.2f}")
        return response
    
    def _prepare_enhanced_context(self, passages: List[Dict]) -> str:
        """Prepare enhanced context from retrieved passages"""
        context_parts = []
        
        # Group passages by page/section for better organization
        passages_by_page = {}
        for passage in passages:
            page = passage['metadata'].get('page_number', 'N/A')
            if page not in passages_by_page:
                passages_by_page[page] = []
            passages_by_page[page].append(passage)
        
        # Format context with better structure
        for page, page_passages in sorted(passages_by_page.items()):
            context_parts.append(f"\n--- Page {page} ---")
            for i, passage in enumerate(page_passages):
                chunk_type = passage['metadata'].get('chunk_type', 'text')
                score = passage['score']
                
                context_parts.append(f"\n[{chunk_type.upper()} - Relevance: {score:.2f}]")
                context_parts.append(passage['content'])
        
        return "\n".join(context_parts)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _generate_answer(self, question: str, context: str, 
                        conversation_history: Optional[List[Dict]] = None) -> Dict:
        """Generate an answer using GPT-4 with retry logic"""
        
        system_prompt = """You are a brand guidelines expert assistant. Your role is to answer questions about brand playbooks accurately and precisely.

When answering:
1. Base your answers strictly on the provided passages from the brand playbook
2. If the information isn't in the passages, say so clearly
3. Quote relevant parts verbatim when appropriate, using quotation marks
4. Be specific and actionable in your responses
5. Maintain the brand's tone and terminology as found in the playbook
6. If relevant, suggest follow-up questions that might help clarify the brand guidelines
7. Structure your answer with clear sections if it's complex

Remember: You are helping users understand and apply brand guidelines correctly."""

        user_prompt = f"""Based on the following passages from the brand playbook, please answer this question:

Question: {question}

Relevant passages from the brand playbook:
{context}

Please provide a clear, accurate answer based on these passages. If you quote from the passages, use quotation marks.

At the end, suggest 2-3 relevant follow-up questions that might help the user better understand the brand guidelines."""

        try:
            # Build message history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history[-4:])  # Last 4 messages for context
            
            messages.append({"role": "user", "content": user_prompt})
            
            # Make API call
            response = openai.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=800,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            # Extract answer and follow-up questions
            full_response = response.choices[0].message.content
            
            # Try to parse follow-up questions
            follow_up_questions = []
            if "follow-up questions:" in full_response.lower():
                parts = full_response.split("follow-up questions:", 1)
                answer = parts[0].strip()
                questions_text = parts[1].strip()
                
                # Extract questions
                import re
                questions = re.findall(r'[-•*]?\s*(.+?)(?=[-•*]|$)', questions_text)
                follow_up_questions = [q.strip() for q in questions if q.strip()][:3]
            else:
                answer = full_response
            
            # Track token usage
            tokens_used = response.usage.total_tokens
            self._track_token_usage(response.usage)
            
            return {
                "answer": answer,
                "follow_up_questions": follow_up_questions,
                "tokens_used": tokens_used
            }
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise
    
    def _calculate_confidence(self, passages: List[Dict], answer_data: Dict) -> float:
        """Calculate confidence score based on multiple factors"""
        if not passages:
            return 0.0
        
        # Factor 1: Average passage relevance score
        avg_score = sum(p['score'] for p in passages) / len(passages)
        
        # Factor 2: Number of high-quality passages (score > 0.8)
        high_quality_passages = sum(1 for p in passages if p['score'] > 0.8)
        quality_factor = min(high_quality_passages / 3, 1.0)  # Normalize to 1.0
        
        # Factor 3: Answer length (longer answers often indicate more context)
        answer_length = len(answer_data["answer"].split())
        length_factor = min(answer_length / 100, 1.0)  # Normalize to 1.0
        
        # Weighted combination
        confidence = (avg_score * 0.5) + (quality_factor * 0.3) + (length_factor * 0.2)
        
        return min(confidence, 1.0)  # Cap at 1.0
    
    def _format_passages(self, passages: List[Dict]) -> List[Dict]:
        """Format passages for response"""
        formatted = []
        
        for passage in passages:
            formatted.append({
                "content": passage["content"],
                "page_number": passage["metadata"].get("page_number", "N/A"),
                "chunk_type": passage["metadata"].get("chunk_type", "text"),
                "score": round(passage["score"], 3)
            })
        
        return formatted
    
    def _track_token_usage(self, usage):
        """Track token usage for cost monitoring"""
        self.token_usage["total_prompt_tokens"] += usage.prompt_tokens
        self.token_usage["total_completion_tokens"] += usage.completion_tokens
        
        # Calculate cost (GPT-4 Turbo pricing as of 2024)
        prompt_cost = usage.prompt_tokens * 0.01 / 1000
        completion_cost = usage.completion_tokens * 0.03 / 1000
        self.token_usage["total_cost"] += (prompt_cost + completion_cost)
        
        logger.info(f"Token usage - Prompt: {usage.prompt_tokens}, "
                   f"Completion: {usage.completion_tokens}, "
                   f"Cost: ${prompt_cost + completion_cost:.4f}")
    
    def get_token_usage_report(self) -> Dict:
        """Get token usage report"""
        return {
            **self.token_usage,
            "average_cost_per_query": self.token_usage["total_cost"] / max(self.token_usage.get("query_count", 1), 1)
        }
    
    def generate_summary(self, playbook_id: str) -> Dict:
        """Generate a summary of a playbook's key points"""
        logger.info(f"Generating summary for playbook: {playbook_id}")
        
        # Get sample passages from different sections
        sample_passages = self.vector_store.search(
            query="brand guidelines overview mission values visual identity",
            playbook_id=playbook_id,
            top_k=10
        )
        
        if not sample_passages:
            return {
                "summary": "No content found for this playbook.",
                "key_sections": []
            }
        
        context = self._prepare_enhanced_context(sample_passages)
        
        prompt = f"""Based on the following excerpts from a brand playbook, provide a concise summary of:
1. The brand's mission and values
2. Key visual identity elements
3. Important usage guidelines
4. Any unique brand characteristics

Excerpts:
{context}

Provide a structured summary with clear sections."""
        
        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a brand expert summarizing key brand guidelines."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            return {
                "summary": response.choices[0].message.content,
                "key_sections": [p["metadata"].get("chunk_type", "text") for p in sample_passages[:5]]
            }
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return {
                "summary": "Error generating summary.",
                "key_sections": []
            }
