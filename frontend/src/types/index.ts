export interface User {
  username: string;
  email?: string;
  full_name?: string;
}

export interface Playbook {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  chunk_count: number;
}

export interface Passage {
  content: string;
  page_number: number;
  chunk_type: string;
  score: number;
}

export interface QuestionResponse {
  answer: string;
  passages: Passage[];
  confidence: number;
  tokens_used: number;
  follow_up_questions: string[];
}

export interface UploadResponse {
  playbook_id: string;
  filename: string;
  status: string;
  message: string;
  chunk_count: number;
}

export interface PlaybookListResponse {
  playbooks: Playbook[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Statistics {
  vector_store: {
    total_chunks: number;
    total_playbooks: number;
    metadata_entries: number;
    embedding_model: string;
  };
  token_usage: {
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_cost: number;
    average_cost_per_query: number;
  };
  api_version: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  passages?: Passage[];
  confidence?: number;
}

export interface ApiKeyValidationResponse {
  valid: boolean;
  message: string;
  model?: string;
}
