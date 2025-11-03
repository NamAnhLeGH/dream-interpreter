import {
  DEMO_USERS,
  DEMO_DREAMS,
  generateMockInterpretation,
  getDemoStats,
  DEMO_ADMIN_ANALYTICS,
  DEMO_ADMIN_USERS,
} from './demoData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
let isDemoMode = false;

// Demo data storage
const demoStorage = {
  dreams: [...DEMO_DREAMS],
  apiCalls: 5,
};

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
    // If network error, switch to demo mode
    if (error instanceof TypeError && error.message.includes('fetch')) {
      isDemoMode = true;
      console.log('Backend unavailable, switching to demo mode');
      throw new Error('DEMO_MODE');
    }
    throw error;
  }
}

export const auth = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      return await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        // Demo mode: simulate registration
        return {
          success: false,
          message: 'Demo mode: Registration disabled. Please use demo accounts (john@john.com / 123 or admin@admin.com / 111)',
        };
      }
      throw error;
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      return await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        // Demo mode: check against demo users
        const demoUser = DEMO_USERS[email];
        
        if (demoUser && demoUser.password === password) {
          const token = `demo_token_${email}`;
          return {
            success: true,
            token,
            user: { ...demoUser.user },
          };
        }
        
        return {
          success: false,
          message: 'Invalid credentials. Try john@john.com / 123 or admin@admin.com / 111',
        };
      }
      throw error;
    }
  },
};

export const dreams = {
  interpret: async (dream_text: string): Promise<DreamInterpretation> => {
    try {
      return await apiCall('/api/dreams/interpret', {
        method: 'POST',
        body: JSON.stringify({ dream_text }),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        // Demo mode: generate mock interpretation
        const result = generateMockInterpretation(dream_text, demoStorage.apiCalls);
        demoStorage.apiCalls++;
        
        // Add to demo dreams
        const newDream: Dream = {
          id: demoStorage.dreams.length + 1,
          dream_text,
          sentiment: result.emotional_tone.sentiment,
          symbols: result.symbols_detected.map(s => ({ symbol: s.symbol, meaning: s.meaning })),
          created_at: new Date().toISOString(),
        };
        demoStorage.dreams.unshift(newDream);
        
        return result;
      }
      throw error;
    }
  },

  getHistory: async (): Promise<{ dreams: Dream[] }> => {
    try {
      return await apiCall('/api/dreams/history');
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        return { dreams: demoStorage.dreams };
      }
      throw error;
    }
  },

  getStats: async (): Promise<DreamStats> => {
    try {
      return await apiCall('/api/dreams/stats');
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        return getDemoStats(demoStorage.apiCalls);
      }
      throw error;
    }
  },
};

export const admin = {
  getUsers: async () => {
    try {
      return await apiCall('/api/admin/users');
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        return DEMO_ADMIN_USERS;
      }
      throw error;
    }
  },

  getAnalytics: async () => {
    try {
      return await apiCall('/api/admin/analytics');
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_MODE') {
        return DEMO_ADMIN_ANALYTICS;
      }
      throw error;
    }
  },
};
