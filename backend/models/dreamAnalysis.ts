import { pipeline, Pipeline } from '@xenova/transformers';

interface Symbol {
  symbol: string;
  meaning: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface EmotionalTone {
  sentiment: 'POSITIVE' | 'NEGATIVE';
  confidence: string;
  description: string;
}

interface DreamInterpretation {
  emotional_tone: EmotionalTone;
  symbols_detected: Symbol[];
  ai_interpretation: string;
  personalized_advice: string;
  analysis_summary: string;
}

let sentimentModel: Pipeline | null = null;
let modelsLoading = false;
let modelsReadyFlag = false;

// Initialize AI models
export async function initializeModels(): Promise<void> {
  if (modelsLoading || modelsReadyFlag) return;
  
  modelsLoading = true;
  console.log('🤖 Loading AI models...');
  
  try {
    sentimentModel = await pipeline(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    ) as Pipeline;
    
    modelsReadyFlag = true;
    modelsLoading = false;
    console.log('✓ AI models loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load AI models:', error);
    modelsLoading = false;
    throw error;
  }
}

// Check if models are ready
export function modelsReady(): boolean {
  return modelsReadyFlag && sentimentModel !== null;
}

// Extract symbols from dream text
function extractSymbols(dreamText: string): Symbol[] {
  const commonSymbols: Record<string, { meaning: string; sentiment: 'positive' | 'negative' | 'neutral' }> = {
    water: { meaning: 'Emotions, subconscious, cleansing', sentiment: 'neutral' },
    fire: { meaning: 'Passion, transformation, anger', sentiment: 'positive' },
    snake: { meaning: 'Transformation, hidden fears, healing', sentiment: 'negative' },
    death: { meaning: 'Endings, transformation, new beginnings', sentiment: 'neutral' },
    flying: { meaning: 'Freedom, liberation, escape', sentiment: 'positive' },
    falling: { meaning: 'Loss of control, anxiety, insecurity', sentiment: 'negative' },
    teeth: { meaning: 'Anxiety about appearance, communication issues', sentiment: 'negative' },
    house: { meaning: 'Self, personal security, inner life', sentiment: 'neutral' },
    car: { meaning: 'Life journey, personal drive, control', sentiment: 'neutral' },
    baby: { meaning: 'New beginnings, innocence, vulnerability', sentiment: 'positive' },
    animal: { meaning: 'Instincts, natural impulses, untamed aspects', sentiment: 'neutral' },
    chase: { meaning: 'Running from problems, avoidance, fear', sentiment: 'negative' },
    money: { meaning: 'Value, self-worth, security', sentiment: 'neutral' },
    food: { meaning: 'Nourishment, satisfaction, emotional needs', sentiment: 'positive' },
    school: { meaning: 'Learning, growth, evaluation', sentiment: 'neutral' }
  };
  
  const symbolsDetected: Symbol[] = [];
  const lowerText = dreamText.toLowerCase();
  
  for (const [symbol, data] of Object.entries(commonSymbols)) {
    if (lowerText.includes(symbol)) {
      symbolsDetected.push({
        symbol: symbol.charAt(0).toUpperCase() + symbol.slice(1),
        meaning: data.meaning,
        sentiment: data.sentiment
      });
    }
  }
  
  if (symbolsDetected.length === 0) {
    symbolsDetected.push({
      symbol: 'Life',
      meaning: 'General life experiences and emotions',
      sentiment: 'neutral'
    });
  }
  
  return symbolsDetected;
}

// Generate interpretation
async function generateInterpretation(_dreamText: string, sentiment: 'POSITIVE' | 'NEGATIVE', symbols: Symbol[]): Promise<{ ai_interpretation: string; personalized_advice: string; analysis_summary: string }> {
  const sentimentText = sentiment === 'POSITIVE' 
    ? 'positive and uplifting' 
    : 'negative or concerning';
  
  const symbolsList = symbols.map(s => s.symbol).join(', ');
  
  const aiInterpretation = `Your dream reflects a ${sentimentText} emotional tone. The symbols present (${symbolsList}) suggest aspects of your subconscious mind are processing recent experiences or emotions. Dreams often serve as a way for our minds to work through thoughts and feelings that may not be fully processed during waking hours.`;
  
  const personalizedAdvice = sentiment === 'POSITIVE'
    ? 'Continue to embrace the positive energy this dream represents. Consider journaling about these symbols and how they might relate to recent positive changes in your life.'
    : 'This dream may be highlighting areas of concern or unresolved emotions. Take time to reflect on what might be causing stress or anxiety in your life, and consider speaking with someone you trust.';
  
  const analysisSummary = `The dream contains ${symbols.length} key symbol${symbols.length > 1 ? 's' : ''}, indicating ${sentimentText === 'positive and uplifting' ? 'a favorable' : 'a challenging'} period in your life. Pay attention to how these symbols relate to your current circumstances.`;
  
  return {
    ai_interpretation: aiInterpretation,
    personalized_advice: personalizedAdvice,
    analysis_summary: analysisSummary
  };
}

// Main dream interpretation function
export async function interpretDream(dreamText: string): Promise<DreamInterpretation> {
  if (!modelsReady()) {
    await initializeModels();
  }
  
  try {
    // Analyze sentiment
    const sentimentResult = await (sentimentModel as Pipeline)(dreamText) as Array<{ label: string; score: number }>;
    const sentiment: 'POSITIVE' | 'NEGATIVE' = sentimentResult[0].label === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
    const confidence = (sentimentResult[0].score * 100).toFixed(1);
    
    // Extract symbols
    const symbolsDetected = extractSymbols(dreamText);
    
    // Generate interpretation
    const interpretation = await generateInterpretation(dreamText, sentiment, symbolsDetected);
    
    // Build emotional tone description
    const emotionalToneDescription = sentiment === 'POSITIVE'
      ? 'Your dream conveys positive emotions, suggesting feelings of hope, joy, or contentment.'
      : 'Your dream reflects more challenging emotions, possibly indicating stress, anxiety, or unresolved concerns.';
    
    return {
      emotional_tone: {
        sentiment: sentiment,
        confidence: `${confidence}%`,
        description: emotionalToneDescription
      },
      symbols_detected: symbolsDetected,
      ...interpretation
    };
    
  } catch (error) {
    console.error('Dream interpretation error:', error);
    
    // Fallback interpretation if AI fails
    const fallbackSymbols = extractSymbols(dreamText);
    return {
      emotional_tone: {
        sentiment: 'POSITIVE',
        confidence: '50%',
        description: 'Unable to analyze sentiment automatically. Please consider your own feelings about this dream.'
      },
      symbols_detected: fallbackSymbols,
      ai_interpretation: 'Dream interpretation requires careful reflection. Consider the symbols present and how they relate to your current life circumstances.',
      personalized_advice: 'Take time to reflect on this dream and how its themes might connect to your waking life.',
      analysis_summary: `Found ${fallbackSymbols.length} symbol${fallbackSymbols.length > 1 ? 's' : ''} in your dream. Reflect on their meaning in the context of your life.`
    };
  }
}

// Initialize models on import (non-blocking)
initializeModels().catch((err: Error) => {
  console.error('Failed to initialize models:', err);
});

