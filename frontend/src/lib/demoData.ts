import { User, DreamInterpretation, Dream, DreamStats } from './api';

// Demo users
export const DEMO_USERS: Record<string, { user: User; password: string }> = {
  'john@john.com': {
    password: '123',
    user: {
      id: 1,
      email: 'john@john.com',
      role: 'user',
      api_calls_used: 5,
    },
  },
  'admin@admin.com': {
    password: '111',
    user: {
      id: 2,
      email: 'admin@admin.com',
      role: 'admin',
      api_calls_used: 15,
    },
  },
};

// Demo dreams for John
export const DEMO_DREAMS: Dream[] = [
  {
    id: 1,
    dream_text: 'I was flying over a vast ocean under a starry sky. The water below was calm and reflecting the moonlight. I felt incredibly peaceful and free.',
    sentiment: 'POSITIVE',
    symbols: [
      { symbol: 'flying', meaning: 'Freedom and transcendence' },
      { symbol: 'ocean', meaning: 'Emotions and the subconscious' },
      { symbol: 'stars', meaning: 'Hope and guidance' },
    ],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    dream_text: 'I found myself in an ancient library with endless shelves of glowing books. Each book I touched revealed secrets of the universe.',
    sentiment: 'POSITIVE',
    symbols: [
      { symbol: 'library', meaning: 'Knowledge and wisdom' },
      { symbol: 'books', meaning: 'Learning and discovery' },
    ],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    dream_text: 'I was lost in a dark forest, unable to find my way out. The trees seemed to close in around me.',
    sentiment: 'NEGATIVE',
    symbols: [
      { symbol: 'forest', meaning: 'Confusion or being lost' },
      { symbol: 'darkness', meaning: 'Fear or uncertainty' },
    ],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Generate mock interpretation
export const generateMockInterpretation = (dreamText: string, currentApiCalls: number): DreamInterpretation => {
  const newApiCalls = currentApiCalls + 1;
  const remaining = Math.max(0, 20 - newApiCalls);
  
  // Detect common symbols
  const symbols = [];
  const lowerText = dreamText.toLowerCase();
  
  if (lowerText.includes('fly') || lowerText.includes('flying')) {
    symbols.push({ symbol: 'flying', meaning: 'Represents freedom, transcendence, and rising above challenges', sentiment: 'positive' as const });
  }
  if (lowerText.includes('water') || lowerText.includes('ocean') || lowerText.includes('sea')) {
    symbols.push({ symbol: 'water', meaning: 'Symbolizes emotions, the subconscious mind, and adaptability', sentiment: 'neutral' as const });
  }
  if (lowerText.includes('fall') || lowerText.includes('falling')) {
    symbols.push({ symbol: 'falling', meaning: 'Indicates loss of control or anxiety about a situation', sentiment: 'negative' as const });
  }
  if (lowerText.includes('house') || lowerText.includes('home')) {
    symbols.push({ symbol: 'house', meaning: 'Represents the self, security, and personal identity', sentiment: 'neutral' as const });
  }
  if (lowerText.includes('snake')) {
    symbols.push({ symbol: 'snake', meaning: 'Can represent transformation, healing, or hidden threats', sentiment: 'neutral' as const });
  }

  const sentiment: 'POSITIVE' | 'NEGATIVE' = symbols.some(s => s.sentiment === 'negative') ? 'NEGATIVE' : 'POSITIVE';

  return {
    ...(newApiCalls > 20 ? { warning: 'You have used all 20 free interpretations. Results will still be provided.' } : {}),
    emotional_tone: {
      sentiment,
      confidence: '87.3%',
      description: sentiment === 'POSITIVE' 
        ? 'This dream carries a predominantly positive emotional tone, suggesting feelings of hope, growth, or contentment.'
        : 'This dream reflects some underlying concerns or anxieties that may benefit from further reflection.',
    },
    symbols_detected: symbols,
    ai_interpretation: `This dream appears to reflect your current mental and emotional state. The imagery suggests you are processing ${
      sentiment === 'POSITIVE' ? 'positive experiences' : 'challenges or uncertainties'
    } in your waking life.\n\nThe symbols present indicate themes of ${
      symbols.length > 0 ? symbols.map(s => s.symbol).join(', ') : 'personal growth and self-discovery'
    }. These elements often appear when the dreamer is navigating significant life transitions or contemplating deeper questions about their path forward.\n\nPay attention to how these themes manifest in your daily life, as dreams often serve as a mirror to our subconscious processing.`,
    personalized_advice: `Based on this dream, consider:\n\n• Taking time for self-reflection on the areas of your life this dream highlights\n• Journaling about these symbols and what they mean to you personally\n• ${
      sentiment === 'POSITIVE' 
        ? 'Embracing the positive energy and using it to fuel your goals' 
        : 'Addressing any anxieties or concerns in a constructive way'
    }\n• Discussing these themes with a trusted friend or counselor if they resonate deeply`,
    analysis_summary: `A ${sentiment.toLowerCase()} dream featuring ${
      symbols.length > 0 ? symbols.length + ' significant symbols' : 'personal imagery'
    }, suggesting ${
      sentiment === 'POSITIVE' 
        ? 'a period of growth and positive transformation' 
        : 'the need to address underlying concerns or challenges'
    }.`,
    api_calls_remaining: remaining,
  };
};

// Demo stats
export const getDemoStats = (apiCallsUsed: number): DreamStats => ({
  api_calls_used: apiCallsUsed,
  api_calls_remaining: Math.max(0, 20 - apiCallsUsed),
  total_dreams: DEMO_DREAMS.length,
  recurring_symbols: [
    { symbol: 'flying', frequency: 3 },
    { symbol: 'water', frequency: 2 },
    { symbol: 'books', frequency: 2 },
    { symbol: 'forest', frequency: 1 },
  ],
});

// Admin analytics
export const DEMO_ADMIN_ANALYTICS = {
  total_users: 156,
  total_dreams: 487,
  most_common_symbols: [
    { symbol: 'water', total_frequency: 89 },
    { symbol: 'flying', total_frequency: 76 },
    { symbol: 'falling', total_frequency: 65 },
    { symbol: 'house', total_frequency: 54 },
    { symbol: 'snake', total_frequency: 43 },
    { symbol: 'death', total_frequency: 38 },
    { symbol: 'car', total_frequency: 35 },
    { symbol: 'fire', total_frequency: 32 },
    { symbol: 'dog', total_frequency: 28 },
    { symbol: 'tree', total_frequency: 25 },
  ],
  sentiment_distribution: [
    { sentiment: 'POSITIVE', count: 298 },
    { sentiment: 'NEGATIVE', count: 189 },
  ],
};

// Admin users list
export const DEMO_ADMIN_USERS = {
  users: [
    {
      id: 1,
      email: 'john@john.com',
      role: 'user',
      api_calls_used: 5,
      total_dreams: 3,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      email: 'admin@admin.com',
      role: 'admin',
      api_calls_used: 15,
      total_dreams: 8,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      email: 'sarah@example.com',
      role: 'user',
      api_calls_used: 20,
      total_dreams: 12,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      email: 'mike@example.com',
      role: 'user',
      api_calls_used: 8,
      total_dreams: 5,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
