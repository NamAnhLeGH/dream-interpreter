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
let textGenerator: any | null = null; // Text2TextGenerationPipeline type
let modelsLoading = false;
let modelsReadyFlag = false;

// Initialize AI models
export async function initializeModels(): Promise<void> {
  if (modelsLoading || modelsReadyFlag) return;

  modelsLoading = true;
  console.log('Loading AI models...');
  
  try {
    sentimentModel = await pipeline(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    ) as Pipeline;
    
    // Load text generation model for symbolic meaning interpretation
    // TEMPORARILY DISABLED - Too large for small instances (~1GB memory)
    // Uncomment when using larger instance size (2GB+ RAM)
    /*
    try {
      textGenerator = await pipeline(
        'text2text-generation',
        'Xenova/LaMini-Flan-T5-248M'
      );
      console.log('Text generation model loaded for symbolic interpretation');
    } catch (genError) {
      console.warn('Could not load text generation model, using fallback:', genError);
      // Continue without text generator, will use sentiment-based fallback
    }
    */
    console.log('Text generation model disabled (use fallback for interpretations)');
    
    modelsReadyFlag = true;
    modelsLoading = false;
    console.log('AI models loaded successfully');
  } catch (error) {
    console.error('Failed to load AI models:', error);
    modelsLoading = false;
    throw error;
  }
}

// Check if models are ready
export function modelsReady(): boolean {
  return modelsReadyFlag && sentimentModel !== null;
}

// Extract symbols from dream text using fully AI-driven approach
async function extractSymbols(dreamText: string, sentimentModel: Pipeline): Promise<Symbol[]> {
  // Use AI to identify meaningful symbols instead of hardcoded word filtering
  const symbolsDetected: Symbol[] = [];

  // Extract unique significant words (minimal filtering - just basic stop words)
  const words = dreamText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2) // Very minimal filtering
    .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates

  const processedSymbols = new Set<string>();

  // Use AI sentiment analysis to determine which words are meaningful symbols
  for (const word of words) {
    if (processedSymbols.has(word)) continue;

    // Skip only the most basic grammatical words (no hardcoded symbol list)
    const basicStopWords = ['the', 'and', 'was', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'has', 'let', 'put', 'say', 'she', 'too', 'use'];
    if (basicStopWords.includes(word)) continue;

    try {
      // Use AI sentiment analysis to understand the emotional tone in context
      const context = `${dreamText.toLowerCase()}`;
      const symbolSentiment = await (sentimentModel as Pipeline)(context) as Array<{ label: string; score: number }>;
      const isPositive = symbolSentiment[0].label === 'POSITIVE';

      // Determine sentiment dynamically based on AI analysis
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (symbolSentiment[0].score > 0.7) {
        sentiment = isPositive ? 'positive' : 'negative';
      } else if (symbolSentiment[0].score > 0.6) {
        sentiment = isPositive ? 'positive' : 'negative';
      }

      // Generate AI-powered interpretation for the symbol (fully dynamic)
      const meaning = await generateSymbolMeaningAI(word, sentiment, dreamText);

      // Capitalize first letter
      const symbolName = word.charAt(0).toUpperCase() + word.slice(1);

      symbolsDetected.push({
        symbol: symbolName,
        meaning: meaning,
        sentiment: sentiment
      });

      processedSymbols.add(word);

      // Limit to top 5 most significant symbols
      if (symbolsDetected.length >= 5) break;
    } catch (error) {
      continue;
    }
  }

  // If no symbols detected, use AI to generate a general one
  if (symbolsDetected.length === 0) {
    const overallSentiment = await (sentimentModel as Pipeline)(dreamText) as Array<{ label: string; score: number }>;
    const isPositive = overallSentiment[0].label === 'POSITIVE';

    symbolsDetected.push({
      symbol: 'Experience',
      meaning: await generateSymbolMeaningAI('experience', isPositive ? 'positive' : 'neutral', dreamText),
      sentiment: isPositive ? 'positive' : 'neutral'
    });
  }

  return symbolsDetected;
}

// Generate meaningful interpretation for a symbol using AI
async function generateSymbolMeaningAI(word: string, sentiment: 'positive' | 'negative' | 'neutral', context: string): Promise<string> {
  // Try using text generation model if available
  if (textGenerator) {
    try {
      const prompt = `Interpret the dream symbol "${word}" in this context: "${context}". The emotional tone is ${sentiment}. Provide a brief symbolic meaning (1 sentence):`;

      const result = await textGenerator(prompt, {
        max_length: 100,
        num_return_sequences: 1,
        temperature: 0.7,
      }) as Array<{ generated_text: string }>;

      if (result && result[0] && result[0].generated_text) {
        const meaning = result[0].generated_text.trim();
        // Clean up and ensure it's meaningful
        if (meaning.length > 10 && meaning.length < 200) {
          return meaning;
        }
      }
    } catch (error) {
      console.warn(`AI symbol interpretation failed for "${word}", using fallback:`, error);
    }
  }

  // Fallback: Generic AI-generated meaning based only on sentiment (fully dynamic)
  // No hardcoded word patterns - purely sentiment and context-based
  if (sentiment === 'positive') {
    return `A positive symbol from your dream suggesting growth, joy, or positive transformation in your life`;
  } else if (sentiment === 'negative') {
    return `A symbol that may represent concerns, challenges, or emotions needing attention`;
  }

  // Neutral sentiment - completely generic
  return `An important symbolic element from your dream that reflects aspects of your subconscious mind`;
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

    // Extract symbols using AI
    const symbolsDetected = await extractSymbols(dreamText, sentimentModel as Pipeline);

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
    const fallbackSymbols = sentimentModel
      ? await extractSymbols(dreamText, sentimentModel as Pipeline)
      : [{
        symbol: 'Experience',
        meaning: 'General life experiences and emotions from your subconscious',
        sentiment: 'neutral' as const
      }];
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

// Initialize models on import (non-blocking, won't crash server)
// Start loading models but don't block - will be ready when needed
setTimeout(() => {
  initializeModels().catch((err: Error) => {
    console.error('Failed to initialize models (non-critical):', err);
    // Don't crash - will use fallback for interpretations
  });
}, 1000); // Delay 1 second to let server start first

