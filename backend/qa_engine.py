import openai
from typing import List, Dict, Optional
import os
from vector_store import VectorStore

class QAEngine:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        openai.api_key = os.getenv("OPENAI_API_KEY")
        self.model = "gpt-4-turbo-preview"
    
    def answer_question(self, question: str, playbook_id: Optional[str] = None) -> Dict:
        """Answer a question using relevant passages from the playbook"""
        
        # Search for relevant passages
        relevant_passages = self.vector_store.search(
            query=question,
            playbook_id=playbook_id,
            top_k=5
        )
        
        if not relevant_passages:
            return {
                "answer": "I couldn't find any relevant information in the brand playbook to answer your question.",
                "passages": [],
                "confidence": 0.0
            }
        
        # Prepare context from passages
        context = self._prepare_context(relevant_passages)
        
        # Generate answer using GPT-4
        answer = self._generate_answer(question, context)
        
        # Calculate confidence based on passage scores
        avg_score = sum(p['score'] for p in relevant_passages) / len(relevant_passages)
        
        return {
            "answer": answer,
            "passages": relevant_passages[:3],  # Return top 3 passages
            "confidence": avg_score
        }
    
    def _prepare_context(self, passages: List[Dict]) -> str:
        """Prepare context from retrieved passages"""
        context_parts = []
        
        for i, passage in enumerate(passages[:5]):  # Use top 5 passages
            context_parts.append(f"Passage {i+1} (Page {passage['metadata'].get('page_number', 'N/A')}):")
            context_parts.append(passage['content'])
            context_parts.append("")
        
        return "\n".join(context_parts)

    def _generate_answer(self, question: str, context: str) -> str:
        """Generate an answer using GPT-4"""
        
        system_prompt = """You are a brand guidelines expert assistant. Your role is to answer questions about brand playbooks accurately and precisely. 

When answering:
1. Base your answers strictly on the provided passages from the brand playbook
2. If the information isn't in the passages, say so clearly
3. Quote relevant parts verbatim when appropriate
4. Be specific and actionable in your responses
5. Maintain the brand's tone and terminology as found in the playbook"""

        user_prompt = f"""Based on the following passages from the brand playbook, please answer this question:

Question: {question}

Relevant passages from the brand playbook:
{context}

Please provide a clear, accurate answer based on these passages. If you quote from the passages, indicate which passage number you're quoting from."""

        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating answer: {e}")
            return "I encountered an error while generating the answer. Please try again."
