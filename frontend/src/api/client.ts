import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Load API key from sessionStorage
    this.apiKey = sessionStorage.getItem('openai_api_key');

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        // Add API key if available
        if (this.apiKey && config.headers) {
          config.headers['X-API-Key'] = this.apiKey;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.logout();
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        } else if (error.response?.status === 429) {
          // Rate limit exceeded
          toast.error('Too many requests. Please slow down.');
        } else if (error.response?.status === 400) {
          // Check if it's an API key error
          const errorMessage = (error.response.data as any)?.detail || '';
          if (errorMessage.includes('OpenAI API key')) {
            toast.error('Please set your OpenAI API key in the settings.');
          }
        } else if (error.response?.status === 500) {
          // Server error
          toast.error('Server error. Please try again later.');
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  setApiKey(apiKey: string | null) {
    this.apiKey = apiKey;
    if (apiKey) {
      sessionStorage.setItem('openai_api_key', apiKey);
      this.client.defaults.headers.common['X-API-Key'] = apiKey;
    } else {
      sessionStorage.removeItem('openai_api_key');
      delete this.client.defaults.headers.common['X-API-Key'];
    }
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    delete this.client.defaults.headers.common['Authorization'];
    // Keep API key in session
  }

  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.client.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.access_token) {
      this.setAuthToken(response.data.access_token);
    }

    return response.data;
  }

  async validateApiKey(apiKey: string) {
    const response = await this.client.post('/validate-api-key', {
      api_key: apiKey,
    });
    return response.data;
  }

  async uploadPlaybook(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async askQuestion(question: string, playbookId?: string, conversationHistory?: any[]) {
    const response = await this.client.post('/ask', {
      question,
      playbook_id: playbookId,
      conversation_history: conversationHistory,
    });
    return response.data;
  }

  async listPlaybooks(page: number = 1, pageSize: number = 10) {
    const response = await this.client.get('/playbooks', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getPlaybookInfo(playbookId: string) {
    const response = await this.client.get(`/playbooks/${playbookId}`);
    return response.data;
  }

  async getPlaybookSummary(playbookId: string) {
    const response = await this.client.get(`/playbooks/${playbookId}/summary`);
    return response.data;
  }

  async deletePlaybook(playbookId: string) {
    const response = await this.client.delete(`/playbooks/${playbookId}`);
    return response.data;
  }

  async getStatistics() {
    const response = await this.client.get('/stats');
    return response.data;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
