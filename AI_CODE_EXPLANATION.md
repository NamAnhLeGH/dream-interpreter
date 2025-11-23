# AI Model Implementation

## Overview

The Dream Interpreter uses **Llama 3.1 8B** (quantized Q4_K_M) for all AI-powered dream analysis. The model is hosted locally using `node-llama-cpp`, which provides efficient CPU-based inference.

## Model Details

- **Model**: Meta-Llama-3.1-8B-Instruct-GGUF
- **Quantization**: Q4_K_M (4-bit, ~5GB)
- **Source**: HuggingFace (bartowski/Meta-Llama-3.1-8B-Instruct-GGUF)
- **Library**: node-llama-cpp
- **Memory**: ~6GB RAM required
- **Context Size**: 2048 tokens
- **GPU**: Not required (CPU-only operation)

## Architecture

### File: `backend/models/dreamAnalysis.ts`

The AI logic is centralized in this file, which handles:
1. Model initialization and loading
2. Automatic model downloading
3. Dream sentiment analysis
4. Symbol extraction and interpretation
5. Full dream interpretation generation

## Key Functions

### `initializeModel()`

**Purpose**: Loads the Llama 3.1 8B model into memory

**Process**:
1. Checks if model file exists in `backend/models/`
2. If missing, automatically downloads from HuggingFace CDN
3. Initializes Llama instance with CPU-only mode
4. Loads model with optimized settings:
   - `gpuLayers: 0` (CPU-only)
   - `contextSize: 2048` (smaller context for CPU)
   - `batchSize: 128`
5. Creates context for text generation

**When it runs**: Automatically on server startup (called from `server.ts`)

### `analyzeSentiment(dreamText: string)`

**Purpose**: Determines the emotional tone of the dream

**Process**:
1. Creates a prompt asking the AI to classify sentiment
2. Uses Llama chat session for structured response
3. Parses AI response to extract POSITIVE/NEGATIVE classification
4. Generates confidence score and description

**Output**: `{ sentiment: 'POSITIVE' | 'NEGATIVE', confidence: string, description: string }`

### `extractSymbols(dreamText: string, sentiment: string)`

**Purpose**: Identifies meaningful symbols in the dream and generates interpretations

**Process**:
1. Creates a detailed prompt asking AI to extract 4-5 key symbols
2. Instructs AI to provide:
   - Symbol name (no extra words like "MEANING")
   - Psychological/symbolic meaning
   - Emotional valence (positive/negative/neutral)
3. Uses regex parsing to extract structured data from AI response
4. Falls back to numbered list format if direct format fails
5. Returns array of `Symbol` objects

**Output**: `Array<{ symbol: string, meaning: string, sentiment: 'positive' | 'negative' | 'neutral' }>`

### `generateInterpretation(dreamText: string, symbols: Symbol[], sentiment: string)`

**Purpose**: Creates the overall dream interpretation and advice

**Process**:
1. Creates comprehensive prompt for full interpretation
2. Instructs AI to generate:
   - Overall interpretation
   - Personalized advice
   - Analysis summary
3. Explicitly instructs AI not to include "MEANING" in output
4. Returns structured interpretation text

**Output**: `{ ai_interpretation: string, personalized_advice: string, analysis_summary: string }`

### `interpretDream(dreamText: string)`

**Purpose**: Main entry point that orchestrates the full analysis

**Process**:
1. Ensures model is loaded and ready
2. Analyzes overall sentiment
3. Extracts symbols with meanings
4. Generates full interpretation
5. Combines all results into final object

**Output**: Complete `DreamInterpretation` object with all analysis

## Model Loading Strategy

### Automatic Download

On first run, if the model file doesn't exist:
- Automatically downloads from HuggingFace CDN
- Shows progress bar during download
- Saves to `backend/models/llama-3.1-8b-q4.gguf`
- Only downloads once (subsequent runs use cached file)

### Memory Management

- Model loads once on server startup
- Stays in memory for fast subsequent requests
- Each interpretation creates a new context (disposed after use)
- Optimized for CPU-only operation (no GPU required)

## Performance Characteristics

- **Initial Load**: 30-60 seconds (model loading)
- **First Request**: May take longer (model warmup)
- **Subsequent Requests**: 5-15 seconds per interpretation
- **Memory Usage**: ~6GB RAM
- **CPU Usage**: High during generation (single-threaded)

## Prompt Engineering

The implementation uses carefully crafted prompts to:
- Get structured responses from the AI
- Avoid unwanted words like "MEANING" in output
- Ensure consistent formatting for parsing
- Guide the AI to provide psychological insights

### Example Prompts

**Sentiment Analysis:**
```
Analyze the emotional tone of this dream: [dream text]
Respond with only: POSITIVE or NEGATIVE
```

**Symbol Extraction:**
```
Extract 4-5 key symbols from this dream: [dream text]
For each symbol, provide:
1. The symbol name (ONLY the symbol name, no extra words)
2. Its psychological/symbolic meaning (do NOT include the word "MEANING")
3. Its emotional valence (positive/negative/neutral)
```

## Error Handling

- Model loading failures throw errors (no silent fallbacks)
- Missing model file triggers automatic download
- Invalid AI responses are caught and logged
- Network errors during download are handled gracefully

## Testing the AI

1. **Check server logs** for model loading messages:
   ```
   [AI] ✓ AI MODEL FULLY LOADED AND READY!
   ```

2. **Test interpretation** via API:
   ```bash
   POST /api/v1/dreams/interpret
   {
     "dream_text": "I was flying over mountains"
   }
   ```

3. **Verify output quality**:
   - Symbol meanings should be contextual and unique
   - Sentiment should match the dream content
   - Interpretation should be coherent and relevant

## Attribution

This implementation uses:
- **node-llama-cpp**: Node.js bindings for llama.cpp
- **Llama 3.1 8B**: Meta's open-source language model
- **HuggingFace**: Model hosting and distribution

All AI-generated content is created by the Llama 3.1 8B model running locally.
