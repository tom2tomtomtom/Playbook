import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Document {
  id: string;
  filename: string;
  upload_date: string;
  status: string;
  page_count?: number;
  extracted_text_length?: number;
}

export interface QueryRequest {
  question: string;
  document_id?: string;
  top_k?: number;
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  passages: Array<{
    text: string;
    source: string;
    relevance_score: number;
    document_id: string;
    highlighted_text: string;
  }>;
  processing_time: number;
}

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const listDocuments = async (): Promise<Document[]> => {
  const response = await axios.get(`${API_BASE}/documents`);
  return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/documents/${documentId}`);
};

export const queryDocuments = async (request: QueryRequest): Promise<QueryResponse> => {
  const response = await axios.post(`${API_BASE}/query`, request);
  return response.data;
};
