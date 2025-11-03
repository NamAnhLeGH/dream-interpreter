const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

if (import.meta.env.PROD && API_URL.includes('localhost')) {
  console.warn('VITE_API_URL not set in production! Using localhost - this will not work.');
}

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  api_calls_used: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  userId?: number;
}

export interface DreamInterpretation {
  warning?: string;
  emotional_tone: {
    sentiment: 'POSITIVE' | 'NEGATIVE';
    confidence: string;
    description: string;
  };
  symbols_detected: Array<{
    symbol: string;
    meaning: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  ai_interpretation: string;
  personalized_advice: string;
  analysis_summary: string;
  api_calls_remaining: number;
}

export interface Dream {
  id: number;
  dream_text: string;
  sentiment: string;
  symbols: Array<{ symbol: string; meaning: string }>;
  created_at: string;
}

export interface DreamStats {
  api_calls_used: number;
  api_calls_remaining: number;
  total_dreams: number;
  recurring_symbols: Array<{ symbol: string; frequency: number }>;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Something went wrong' }));
      throw new Error(error.message || 'Something went wrong');
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
}

export const auth = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

export const dreams = {
  interpret: async (dream_text: string): Promise<DreamInterpretation> => {
    return await apiCall('/api/dreams/interpret', {
      method: 'POST',
      body: JSON.stringify({ dream_text }),
    });
  },

  getHistory: async (): Promise<{ dreams: Dream[] }> => {
    return await apiCall('/api/dreams/history');
  },

  getStats: async (): Promise<DreamStats> => {
    return await apiCall('/api/dreams/stats');
  },
};

export const admin = {
  getUsers: async () => {
    return await apiCall('/api/admin/users');
  },

  getAnalytics: async () => {
    return await apiCall('/api/admin/analytics');
  },
};
