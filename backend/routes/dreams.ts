import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { interpretDream, modelsReady } from '../models/dreamAnalysis.js';
import { prisma } from '../config/db.js';

const router = express.Router();

interface InterpretBody {
  dream_text: string;
}

// Interpret a dream
router.post('/interpret', authMiddleware, async (req: Request<{}, {}, InterpretBody>, res: Response) => {
  try {
    const { dream_text } = req.body;

    if (!dream_text || typeof dream_text !== 'string') {
      res.status(400).json({
        error: 'Dream text is required'
      });
      return;
    }

    const trimmedDream = dream_text.trim();

    if (trimmedDream.length < 10) {
      res.status(400).json({
        error: 'Please describe your dream (minimum 10 characters)'
      });
      return;
    }

    if (trimmedDream.length > 5000) {
      res.status(400).json({
        error: 'Dream description is too long. Please keep it under 5000 characters.'
      });
      return;
    }

    if (!modelsReady()) {
      res.status(503).json({
        error: 'AI models are still loading. Please try again in a moment.'
      });
      return;
    }

    // API call tracking disabled for term project - no limitations
    // const user = await prisma.user.findUnique({
    //   where: { id: req.user!.userId },
    //   select: { api_calls_used: true }
    // });

    // if (!user) {
    //   res.status(404).json({ error: 'User not found' });
    //   return;
    // }

    // const apiCallsUsed = user.api_calls_used;
    let warning: string | null = null;

    // API limit check disabled - no restrictions for term project
    // if (apiCallsUsed >= 20) {
    //   warning = 'You have exceeded your 20 free API calls. Analysis will continue, but consider upgrading for unlimited interpretations.';
    // }

    console.log(`Interpreting dream for user ${req.user!.userId} (${req.user!.email})...`);
    const analysis = await interpretDream(trimmedDream);

    // Store dream in database
    await prisma.dream.create({
      data: {
        user_id: req.user!.userId,
        dream_text: trimmedDream,
        sentiment: analysis.emotional_tone.sentiment,
        sentiment_score: parseFloat(analysis.emotional_tone.confidence) / 100,
        symbols: analysis.symbols_detected as any,
        interpretation: analysis.ai_interpretation
      }
    });

    // Update dream_symbols table using Prisma methods (findUnique + update/create)
    for (const symbol of analysis.symbols_detected) {
      try {
        const existingSymbol = await prisma.dreamSymbol.findUnique({
          where: {
            user_id_symbol: {
              user_id: req.user!.userId,
              symbol: symbol.symbol
            }
          }
        });

        if (existingSymbol) {
          // Update existing symbol with manual frequency calculation
          await prisma.dreamSymbol.update({
            where: { id: existingSymbol.id },
            data: {
              frequency: existingSymbol.frequency + 1
              // last_seen is auto-updated by @updatedAt
            }
          });
        } else {
          // Create new symbol entry
          await prisma.dreamSymbol.create({
            data: {
              user_id: req.user!.userId,
              symbol: symbol.symbol,
              frequency: 1
            }
          });
        }
      } catch (symbolError) {
        console.error(`Error updating symbol ${symbol.symbol}:`, symbolError);
        // Continue with other symbols even if one fails
      }
    }

    // API call incrementing disabled for term project - no tracking
    // const updatedUser = await prisma.user.update({
    //   where: { id: req.user!.userId },
    //   data: { api_calls_used: { increment: 1 } },
    //   select: { api_calls_used: true }
    // });

    // const newApiCallsUsed = updatedUser.api_calls_used;

    console.log(`Dream interpreted successfully for ${req.user!.email}`);

    // Return response matching frontend DreamInterpretation interface
    const response = {
      ...(warning ? { warning } : {}),
      emotional_tone: analysis.emotional_tone,
      symbols_detected: analysis.symbols_detected,
      ai_interpretation: analysis.ai_interpretation,
      personalized_advice: analysis.personalized_advice,
      analysis_summary: analysis.analysis_summary,
      api_calls_remaining: 999 // Unlimited for term project
    };

    res.json(response);

  } catch (error) {
    console.error('Dream interpretation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error message:', errorMessage);
    if (errorStack) console.error('Error stack:', errorStack);
    
    res.status(500).json({
      error: 'Failed to interpret dream. Please try again.',
      ...(process.env.NODE_ENV === 'development' && {
        details: errorMessage,
        stack: errorStack
      })
    });
  }
});

// Get dream history
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.offset as string) || 0;

    const dreamsResult = await prisma.dream.findMany({
      where: { user_id: req.user!.userId },
      select: {
        id: true,
        dream_text: true,
        sentiment: true,
        symbols: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: skip
    });

    // Format dreams to match frontend Dream interface
    const dreams = dreamsResult.map(dream => ({
      id: dream.id,
      dream_text: dream.dream_text,
      sentiment: dream.sentiment || 'NEUTRAL',
      symbols: Array.isArray(dream.symbols)
        ? (dream.symbols as Array<{ symbol: string; meaning: string }>).map((s) => ({
          symbol: s.symbol,
          meaning: s.meaning
        }))
        : [],
      created_at: dream.created_at.toISOString()
    }));

    res.json({ dreams });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch dream history'
    });
  }
});

// Get user stats
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { api_calls_used: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const dreamCount = await prisma.dream.count({
      where: { user_id: req.user!.userId }
    });

    const recurringSymbols = await prisma.dreamSymbol.findMany({
      where: { user_id: req.user!.userId },
      select: {
        symbol: true,
        frequency: true
      },
      orderBy: [
        { frequency: 'desc' },
        { last_seen: 'desc' }
      ],
      take: 10
    });

    const apiCallsUsed = user.api_calls_used;

    // Match frontend DreamStats interface
    res.json({
      api_calls_used: 0, // Not tracking for term project
      api_calls_remaining: 999, // Unlimited for term project
      total_dreams: dreamCount,
      recurring_symbols: recurringSymbols
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

// Get single dream by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dreamId = parseInt(req.params.id);

    const dream = await prisma.dream.findFirst({
      where: {
        id: dreamId,
        user_id: req.user!.userId
      }
    });

    if (!dream) {
      res.status(404).json({
        error: 'Dream not found'
      });
      return;
    }

    res.json({
      dream: {
        id: dream.id,
        dream_text: dream.dream_text,
        sentiment: dream.sentiment || 'NEUTRAL',
        symbols: Array.isArray(dream.symbols) ? dream.symbols : [],
        created_at: dream.created_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Dream fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch dream'
    });
  }
});

// Delete dream
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dreamId = parseInt(req.params.id);

    const dream = await prisma.dream.deleteMany({
      where: {
        id: dreamId,
        user_id: req.user!.userId
      }
    });

    if (dream.count === 0) {
      res.status(404).json({
        error: 'Dream not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Dream deleted successfully'
    });

  } catch (error) {
    console.error('Dream deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete dream'
    });
  }
});

export default router;

