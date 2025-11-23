import { fileURLToPath } from "url";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { getLlama, LlamaModel, LlamaContext, LlamaChatSession, createModelDownloader } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Symbol {
  name: string;      // Word name of the symbol (e.g., "flying", "mountain")
  symbol: string;    // Emoji/icon representation (e.g., "✈️", "🏔️")
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

let llama: Awaited<ReturnType<typeof getLlama>> | null = null;
let model: LlamaModel | null = null;
let context: LlamaContext | null = null;
let isModelLoaded = false;

// Load the best local model
export async function initializeModel(): Promise<void> {
  if (isModelLoaded) {
    console.log('[AI] Model already loaded and ready.');
    return;
  }
  
  const startTime = Date.now();
  console.log('[AI] ========================================');
  console.log('[AI] Starting AI model initialization...');
  console.log('[AI] Model: Llama 3.1 8B (Quantized Q4)');
  console.log('[AI] ========================================');
  
  try {
    // Initialize Llama instance
    console.log('[AI] Step 1/3: Initializing Llama instance...');
    llama = await getLlama();
    console.log('[AI] ✓ Llama instance initialized');
    
    // Use Llama 3.1 8B for best results
    const modelsDir = path.join(__dirname, '../models');
    const modelPath = path.join(modelsDir, 'llama-3.1-8b-q4.gguf');
    console.log('[AI] Step 2/3: Loading model from:', modelPath);
    
    // Check if model file exists, if not download it
    if (!existsSync(modelPath)) {
      console.log('[AI] Model file not found. Downloading Llama 3.1 8B Q4 model...');
      console.log('[AI] This is a large file (~5GB) and may take several minutes...');
      
      // Ensure models directory exists
      if (!existsSync(modelsDir)) {
        mkdirSync(modelsDir, { recursive: true });
      }
      
      try {
        // Download Llama 3.1 8B for better accuracy (much better than TinyLlama)
        console.log('[AI] Attempting to download Llama 3.1 8B Instruct (Q4_K_M)...');
        console.log('[AI] This is a high-quality model (~5GB) - much more accurate than TinyLlama');
        console.log('[AI] Download may take 10-30 minutes depending on your internet speed...');
        
        // Use direct download URL - Llama 3.1 8B from HuggingFace CDN (no auth needed)
        // This is the bartowski quantized version which is well-regarded
        // Repository: bartowski/Meta-Llama-3.1-8B-Instruct-GGUF
        // File: Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf (4.92GB, recommended)
        const downloader = await createModelDownloader({
          modelUri: 'https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
          dirPath: modelsDir,
          fileName: 'llama-3.1-8b-q4.gguf',
          showCliProgress: true,
          onProgress: (status) => {
            const percent = ((status.downloadedSize / status.totalSize) * 100).toFixed(1);
            const downloadedMB = (status.downloadedSize / 1024 / 1024).toFixed(1);
            const totalMB = (status.totalSize / 1024 / 1024).toFixed(1);
            process.stdout.write(`\r[AI] Downloading: ${percent}% (${downloadedMB}MB / ${totalMB}MB)`);
          }
        });
        
        const downloadedPath = await downloader.download();
        console.log('\n[AI] ✓ Model downloaded successfully!');
        console.log('[AI] Using Llama 3.1 8B - High quality model for accurate dream interpretations!');
        
        // Use downloaded path if different, otherwise use expected path
        const actualModelPath = (downloadedPath !== modelPath && existsSync(downloadedPath)) 
          ? downloadedPath 
          : (existsSync(modelPath) ? modelPath : downloadedPath);
        
        console.log('[AI] Loading model from:', actualModelPath);
        model = await llama.loadModel({
          modelPath: actualModelPath,
          gpuLayers: 33
        });
        console.log('[AI] ✓ Model loaded successfully');
        
        console.log('[AI] Step 3/3: Creating context (contextSize: 8192, batchSize: 512)...');
        context = await model.createContext({
          contextSize: 8192,
          batchSize: 512
        });
        console.log('[AI] ✓ Context created successfully');
        
        isModelLoaded = true;
        const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('[AI] ========================================');
        console.log('[AI] ✓ AI MODEL FULLY LOADED AND READY!');
        console.log(`[AI] Load time: ${loadTime} seconds`);
        console.log('[AI] Ready for dream interpretations.');
        console.log('[AI] ========================================');
        return;
      } catch (downloadError) {
        console.error('\n[AI] ✗ Automatic download failed (this is OK - you can download manually)');
        console.error('[AI] ========================================');
        console.error('[AI] MANUAL DOWNLOAD INSTRUCTIONS (FREE, NO ACCOUNT NEEDED):');
        console.error('[AI] ========================================');
        console.error('[AI] RECOMMENDED - High Quality Model (~4.92GB):');
        console.error('[AI]   1. Visit: https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF');
        console.error('[AI]   2. Click "Files and versions" tab');
        console.error('[AI]   3. Download: Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf');
        console.error(`[AI]   4. Rename it to: llama-3.1-8b-q4.gguf`);
        console.error(`[AI]   5. Place it in: ${modelsDir}/`);
        console.error('[AI]');
        console.error('[AI] Alternative - Smaller but less accurate (~700MB):');
        console.error('[AI]   1. Visit: https://huggingface.co/ggml-org/TinyLlama-1.1B-Chat-v1.0');
        console.error('[AI]   2. Click "Files and versions" tab');
        console.error('[AI]   3. Download: TinyLlama-1.1B-Chat-v1.0-Q4_K_M.gguf');
        console.error(`[AI]   4. Rename it to: llama-3.1-8b-q4.gguf`);
        console.error(`[AI]   5. Place it in: ${modelsDir}/`);
        console.error('[AI]   Note: TinyLlama is much less accurate (MMLU score ~25 vs Llama 3.1 8B ~70+)');
        console.error('[AI]');
        console.error('[AI] After downloading, restart the server.');
        console.error('[AI] ========================================');
        console.error('[AI] Note: All models are FREE and PUBLIC - no account needed!');
        console.error('[AI] ========================================');
        // Don't throw - let server continue, AI just won't work until model is added
        console.error('[AI] Server will continue running, but dream interpretations will not work until model is added.');
        return; // Exit gracefully instead of crashing
      }
    } else {
      console.log('[AI] Model file found. This may take a minute (loading ~5GB model into memory)...');
    }
    
    model = await llama.loadModel({
      modelPath: modelPath,
      gpuLayers: 0 // Use CPU only - VRAM is insufficient. Set to higher number if you have more VRAM.
    });
    console.log('[AI] ✓ Model loaded successfully');
    
    console.log('[AI] Step 3/3: Creating context (contextSize: 2048, batchSize: 128)...');
    context = await model.createContext({
      contextSize: 2048, // Fixed small size for systems with limited memory
      batchSize: 128
    });
    console.log('[AI] ✓ Context created successfully');
    
    isModelLoaded = true;
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('[AI] ========================================');
    console.log('[AI] ✓ AI MODEL FULLY LOADED AND READY!');
    console.log(`[AI] Load time: ${loadTime} seconds`);
    console.log('[AI] Ready for dream interpretations.');
    console.log('[AI] ========================================');
  } catch (error) {
    console.error('[AI] ✗ ERROR: Failed to load AI model:', error);
    throw error;
  }
}

// Check if model is ready
export function modelsReady(): boolean {
  const ready = isModelLoaded && model !== null && context !== null;
  if (!ready) {
    console.log('[AI] Status: Model not ready yet');
  }
  return ready;
}

// Get detailed model status
export function getModelStatus(): { ready: boolean; loaded: boolean; hasModel: boolean; hasContext: boolean } {
  return {
    ready: isModelLoaded && model !== null && context !== null,
    loaded: isModelLoaded,
    hasModel: model !== null,
    hasContext: context !== null
  };
}

// Generate with optimized settings for accuracy
async function generateText(prompt: string, systemPrompt: string = ''): Promise<string> {
  if (!model || !context) {
    throw new Error('Model not loaded');
  }
  
  // Create a new context for each generation to avoid sequence exhaustion
  // Use small fixed size for systems with limited memory
  const generationContext = await model.createContext({
    contextSize: 2048, // Fixed small size that works on systems with limited memory
    batchSize: 128
  });
  
  try {
    const sequence = generationContext.getSequence();
    const session = new LlamaChatSession({
      contextSequence: sequence,
      systemPrompt: systemPrompt || 'You are an expert dream interpretation psychologist with deep knowledge of symbolism, Jungian psychology, and dream analysis.',
      autoDisposeSequence: true
    });
    
    const response = await session.prompt(prompt, {
      maxTokens: 600,
      temperature: 0.7, // Balanced creativity and accuracy
      topK: 40,
      topP: 0.9,
      repeatPenalty: {
        penalty: 1.1
      }
    });
    
    return response;
  } finally {
    // Clean up the context after use
    await generationContext.dispose();
  }
}

// Sentiment analysis with AI (more accurate than keywords)
async function analyzeSentiment(dreamText: string): Promise<{ sentiment: 'POSITIVE' | 'NEGATIVE', confidence: number }> {
  const prompt = `Analyze the emotional tone of this dream. Respond with ONLY one word: either "POSITIVE" or "NEGATIVE".

Dream: "${dreamText}"

Emotional tone:`;

  const response = await generateText(prompt);
  const sentiment = response.trim().toUpperCase().includes('POSITIVE') ? 'POSITIVE' : 'NEGATIVE';
  
  // Get confidence
  const confidencePrompt = `Rate your confidence in this emotional tone assessment from 0.5 to 1.0. Respond with ONLY a number.

Dream: "${dreamText}"
Assessment: ${sentiment}

Confidence (0.5-1.0):`;
  
  const confResponse = await generateText(confidencePrompt);
  const confidence = parseFloat(confResponse.trim()) || 0.75;
  
  return { sentiment, confidence: Math.min(Math.max(confidence, 0.5), 0.99) };
}

// Extract symbols with maximum accuracy
async function extractSymbols(dreamText: string, sentiment: 'POSITIVE' | 'NEGATIVE'): Promise<Symbol[]> {
  const prompt = `Extract 4-5 key symbols from this dream. For each symbol, you MUST use this exact format:

NAME: [word name of the symbol, e.g., "flying", "mountain", "eagle"]
SYMBOL: [a single emoji/icon that represents this symbol, e.g., ✈️ for flying, 🏔️ for mountain, 🦅 for eagle]
MEANING: [one sentence explaining the psychological meaning]
SENTIMENT: [positive OR negative OR neutral]

Dream: "${dreamText}"
Overall emotional tone: ${sentiment}

IMPORTANT: 
- NAME should be a word or short phrase (the symbol's name)
- SYMBOL should be a single emoji/icon that visually represents the symbol
- Use the exact format above for each symbol
- Do not add extra text or explanations
- Start directly with NAME: for the first symbol

Example:
NAME: flying
SYMBOL: ✈️
MEANING: Flying represents freedom and liberation from constraints.
SENTIMENT: positive

Now extract 4-5 symbols from the dream above:`;

  try {
    const response = await generateText(prompt, 'You are an expert in dream psychology and symbolism, trained in Jungian analysis and modern dream interpretation.');
    
    // Log raw response for debugging (first 500 chars)
    console.log(`[AI] Raw symbol extraction response (first 500 chars): ${response.substring(0, 500)}`);
    
    const symbols: Symbol[] = [];
    
    // Strategy 1: Look for NAME: SYMBOL: MEANING: SENTIMENT: format (exact format)
    const blocks = response.split(/\n\s*\n/);
    
    for (const block of blocks) {
      const nameMatch = block.match(/NAME:\s*([^\n]+?)(?=\s*SYMBOL:|$)/i);
      const symbolMatch = block.match(/SYMBOL:\s*([^\n]+?)(?=\s*MEANING:|$)/i);
      const meaningMatch = block.match(/MEANING:\s*([^\n]+?)(?=\s*SENTIMENT:|$)/i);
      const sentimentMatch = block.match(/SENTIMENT:\s*(positive|negative|neutral)/i);
      
      if (nameMatch && symbolMatch && meaningMatch && sentimentMatch) {
        symbols.push({
          name: nameMatch[1].trim(),
          symbol: symbolMatch[1].trim(),
          meaning: meaningMatch[1].trim(),
          sentiment: sentimentMatch[1].toLowerCase() as 'positive' | 'negative' | 'neutral'
        });
      }
    }
    
    // Strategy 2: More flexible format - look for any pattern with NAME/SYMBOL/MEANING/SENTIMENT keywords
    if (symbols.length === 0) {
      const lines = response.split('\n');
      let currentSymbol: Partial<Symbol> = {};
      
      for (const line of lines) {
        const nameMatch = line.match(/(?:NAME|Name):\s*(.+)/i);
        const symbolMatch = line.match(/(?:SYMBOL|Symbol|Icon|Emoji):\s*(.+)/i);
        const meaningMatch = line.match(/(?:MEANING|Meaning|Interpretation):\s*(.+)/i);
        const sentimentMatch = line.match(/(?:SENTIMENT|Sentiment|Valence):\s*(positive|negative|neutral)/i);
        
        if (nameMatch) {
          if (currentSymbol.name && currentSymbol.symbol && currentSymbol.meaning) {
            // Save previous symbol if complete
            symbols.push({
              name: currentSymbol.name,
              symbol: currentSymbol.symbol,
              meaning: currentSymbol.meaning,
              sentiment: (currentSymbol.sentiment || 'neutral') as 'positive' | 'negative' | 'neutral'
            });
          }
          currentSymbol = { name: nameMatch[1].trim() };
        }
        if (symbolMatch) {
          currentSymbol.symbol = symbolMatch[1].trim();
        }
        if (meaningMatch) {
          currentSymbol.meaning = meaningMatch[1].trim();
        }
        if (sentimentMatch) {
          currentSymbol.sentiment = sentimentMatch[1].toLowerCase() as 'positive' | 'negative' | 'neutral';
        }
      }
      
      // Add last symbol if complete
      if (currentSymbol.name && currentSymbol.symbol && currentSymbol.meaning) {
        symbols.push({
          name: currentSymbol.name,
          symbol: currentSymbol.symbol,
          meaning: currentSymbol.meaning,
          sentiment: (currentSymbol.sentiment || 'neutral') as 'positive' | 'negative' | 'neutral'
        });
      }
    }
    
    // Strategy 3: Parse numbered lists (1. Symbol: meaning) - extract emoji if present
    if (symbols.length === 0) {
      const numberedPattern = /(\d+)[\.\)]\s*([^\n]+?):\s*([^\n]+)/gi;
      let match;
      while ((match = numberedPattern.exec(response)) !== null && symbols.length < 5) {
        const symbolLine = match[2].trim();
        const meaning = match[3].trim();
        
        // Try to extract emoji from symbol line (emoji usually comes first or after name)
        const emojiMatch = symbolLine.match(/([\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}]+)/u);
        const emoji = emojiMatch ? emojiMatch[1] : '✨';
        
        // Extract name (remove emoji if present)
        const name = symbolLine.replace(/[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}]+/gu, '').trim() || symbolLine;
        
        // Extract sentiment from meaning or default to neutral
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (/positive|good|happy|joy|love|peace|beautiful|success|uplifting|hopeful/i.test(meaning)) {
          sentiment = 'positive';
        } else if (/negative|bad|sad|fear|anger|dark|scary|nightmare|anxiety|stress/i.test(meaning)) {
          sentiment = 'negative';
        }
        
        symbols.push({
          name: name,
          symbol: emoji,
          meaning: meaning,
          sentiment: sentiment
        });
      }
    }
    
    // Strategy 4: Very lenient - extract any capitalized words or phrases as symbols with emoji detection
    if (symbols.length === 0) {
      console.log('[AI] Attempting lenient symbol extraction...');
      // Look for patterns like "Symbol Name - meaning" or "Symbol Name: meaning" or "Emoji Symbol Name: meaning"
      const lenientPattern = /([\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}]+\s*)?([A-Z][A-Za-z\s]+?)[\s\-:]+([^\.\n]+?)(?:\.|$)/gu;
      let match;
      let count = 0;
      while ((match = lenientPattern.exec(response)) !== null && count < 5) {
        const emojiPart = match[1] ? match[1].trim() : '';
        const symbolName = match[2].trim();
        const meaning = match[3].trim();
        
        // Skip if too short or looks like a label
        if (symbolName.length < 3 || symbolName.length > 50 || 
            /^(SYMBOL|MEANING|SENTIMENT|Symbol|Meaning|Sentiment|NAME|Name)$/i.test(symbolName)) {
          continue;
        }
        
        // Use emoji if found, otherwise use default
        const emoji = emojiPart || '✨';
        
        // Extract sentiment
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (/positive|good|happy|joy|love|peace|beautiful|success|uplifting|hopeful/i.test(meaning)) {
          sentiment = 'positive';
        } else if (/negative|bad|sad|fear|anger|dark|scary|nightmare|anxiety|stress/i.test(meaning)) {
          sentiment = 'negative';
        }
        
        symbols.push({
          name: symbolName,
          symbol: emoji,
          meaning: meaning,
          sentiment: sentiment
        });
        count++;
      }
    }
    
    if (symbols.length > 0) {
      console.log(`[AI] Successfully extracted ${symbols.length} symbols`);
      return symbols.slice(0, 5);
    } else {
      console.error('[AI] Failed to extract symbols. Raw response:', response);
      throw new Error('Failed to extract symbols from AI response. No valid symbols found.');
    }
  } catch (error) {
    console.error('[AI] Symbol extraction error:', error);
    throw error;
  }
}

// Generate comprehensive interpretation
async function generateInterpretation(
  dreamText: string,
  sentiment: 'POSITIVE' | 'NEGATIVE',
  symbols: Symbol[]
): Promise<{ ai_interpretation: string; personalized_advice: string; analysis_summary: string }> {
  
  const symbolsList = symbols.map((s, i) => `${i + 1}. ${s.symbol} ${s.name} (${s.sentiment}): ${s.meaning}`).join('\n');
  
  const prompt = `You are an expert dream psychologist. Provide a comprehensive interpretation of this dream.

DREAM TEXT:
"${dreamText}"

EMOTIONAL TONE: ${sentiment}

KEY SYMBOLS IDENTIFIED:
${symbolsList}

Please provide a detailed analysis in three parts:

1. PSYCHOLOGICAL INTERPRETATION (3-4 sentences):
Explain what this dream reveals about the dreamer's subconscious mind, emotional state, and psychological processes. Draw connections between the symbols and possible life circumstances.

2. PERSONALIZED GUIDANCE (3-4 sentences):
Offer thoughtful, supportive advice based on this dream. Help the dreamer understand what actions or reflections might be beneficial.

3. CORE INSIGHT (2 sentences):
Summarize the single most important insight from this dream analysis.

IMPORTANT: Do NOT include unnecessary words like "MEANING" in your response text. Write naturally and directly.

Format your response exactly like this:

INTERPRETATION:
[Your 3-4 sentence psychological interpretation]

ADVICE:
[Your 3-4 sentence personalized guidance]

SUMMARY:
[Your 2 sentence core insight]`;

  try {
    const response = await generateText(
      prompt, 
      'You are a professional dream psychologist with expertise in Jungian psychology, symbolism, and modern dream analysis. Provide insightful, compassionate interpretations.'
    );
    
    // Parse response
    const interpretMatch = response.match(/INTERPRETATION:\s*\n?(.+?)(?=\n\s*ADVICE:|$)/is);
    const adviceMatch = response.match(/ADVICE:\s*\n?(.+?)(?=\n\s*SUMMARY:|$)/is);
    const summaryMatch = response.match(/SUMMARY:\s*\n?(.+?)$/is);
    
    if (!interpretMatch?.[1]?.trim() || !adviceMatch?.[1]?.trim() || !summaryMatch?.[1]?.trim()) {
      throw new Error('Failed to parse AI interpretation response. Missing required sections.');
    }
    
    return {
      ai_interpretation: interpretMatch[1].trim(),
      personalized_advice: adviceMatch[1].trim(),
      analysis_summary: summaryMatch[1].trim()
    };
    
  } catch (error) {
    console.error('[AI] Interpretation generation error:', error);
    throw error; // Re-throw instead of returning fallback
  }
}

// Main function - optimized for accuracy
export async function interpretDream(dreamText: string): Promise<DreamInterpretation> {
  if (!isModelLoaded) {
    console.log('[AI] Model not loaded yet, initializing now...');
    await initializeModel();
  }
  
  try {
    console.log('[AI] ========================================');
    console.log('[AI] Starting dream interpretation...');
    console.log(`[AI] Dream text length: ${dreamText.length} characters`);
    
    // Step 1: Sentiment analysis (AI-powered for accuracy)
    console.log('[AI] Step 1/3: Analyzing emotional tone...');
    const sentimentResult = await analyzeSentiment(dreamText);
    const sentiment = sentimentResult.sentiment;
    const confidence = (sentimentResult.confidence * 100).toFixed(1);
    console.log(`[AI] ✓ Sentiment: ${sentiment} (${confidence}% confidence)`);
    
    // Step 2: Extract symbols with detailed analysis
    console.log('[AI] Step 2/3: Extracting symbols...');
    const symbolsDetected = await extractSymbols(dreamText, sentiment);
    console.log(`[AI] ✓ Extracted ${symbolsDetected.length} symbols`);
    
    // Step 3: Generate comprehensive interpretation
    console.log('[AI] Step 3/3: Generating interpretation...');
    const interpretation = await generateInterpretation(dreamText, sentiment, symbolsDetected);
    console.log('[AI] ✓ Interpretation complete');
    console.log('[AI] ========================================');
    
    const emotionalToneDescription = sentiment === 'POSITIVE'
      ? 'Your dream conveys positive emotions, suggesting feelings of hope, joy, contentment, or optimism about aspects of your life.'
      : 'Your dream reflects more challenging emotions, possibly indicating stress, anxiety, unresolved concerns, or areas requiring attention and care.';
    
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
    throw error;
  }
}