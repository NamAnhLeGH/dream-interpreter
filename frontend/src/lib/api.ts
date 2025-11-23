const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}

if (import.meta.env.PROD && API_URL.includes('localhost')) {
  throw new Error('VITE_API_URL cannot be localhost in production');
}

export interface User {
  id: number;
  first_name: string;
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
    name: string;
    symbol: string;
    meaning: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  ai_interpretation: string;
  personalized_advice: string;
  analysis_summary: string;
  api_calls_used?: number;
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
  const config: RequestInit = {
    ...options,
    credentials: 'include', // Include httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.message || error.error;
    if (!errorMessage) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

export const auth = {
  register: async (first_name: string, email: string, password: string): Promise<AuthResponse> => {
    return await apiCall('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ first_name, email, password }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  verify: async (): Promise<{ user: User | null }> => {
    const stats = await apiCall('/api/v1/dreams/stats');
    // If we get here, user is authenticated
    // User info should be retrieved from login response or separate endpoint
    return { user: null };
  },
};

export const dreams = {
  interpret: async (dream_text: string): Promise<DreamInterpretation> => {
    return await apiCall('/api/v1/dreams/interpret', {
      method: 'POST',
      body: JSON.stringify({ dream_text }),
    });
  },

  getHistory: async (): Promise<{ dreams: Dream[] }> => {
    return await apiCall('/api/v1/dreams/history');
  },

  getStats: async (): Promise<DreamStats> => {
    return await apiCall('/api/v1/dreams/stats');
  },
};

export const admin = {
  getUsers: async () => {
    return await apiCall('/api/v1/admin/users');
  },

  getAnalytics: async () => {
    return await apiCall('/api/v1/admin/analytics');
  },

  getEndpointStats: async () => {
    return await apiCall('/api/v1/admin/endpoint-stats');
  },
};
