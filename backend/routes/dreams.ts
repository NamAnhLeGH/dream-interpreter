import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { interpretDream, modelsReady } from '../models/dreamAnalysis.js';
import { prisma } from '../config/db.js';
import { messages } from '../messages.js';
import { SymbolType, getSymbolName } from '../types/symbols.js';

const router = express.Router();

const FREE_API_CALLS_LIMIT = 20;

interface InterpretBody {
  dream_text: string;
}

interface UpdateDreamBody {
  dream_text: string;
}

// Helper function to increment API calls and check limit
async function incrementApiCalls(userId: number): Promise<{ calls_used: number; calls_remaining: number; warning: string | null }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { api_calls_used: { increment: 1 } },
    select: { api_calls_used: true }
  });

  const calls_used = user.api_calls_used;
  const calls_remaining = Math.max(0, FREE_API_CALLS_LIMIT - calls_used);
  let warning: string | null = null;

  if (calls_used >= FREE_API_CALLS_LIMIT) {
    warning = messages.dreams.interpret.apiLimitReached;
  } else if (calls_used > FREE_API_CALLS_LIMIT - 5) {
    warning = messages.dreams.interpret.apiLimitWarning
      .replace('{used}', calls_used.toString())
      .replace('{remaining}', calls_remaining.toString());
  }

  return { calls_used, calls_remaining, warning };
}

/**
 * @swagger
 * /api/v1/dreams/interpret:
 *   post:
 *     summary: Interpret a dream using AI (consumes 1 API call)
 *     tags: [Dreams]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dream_text
 *             properties:
 *               dream_text:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 example: "I was flying over beautiful mountains with golden eagles"
 *     responses:
 *       200:
 *         description: Dream interpretation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 warning:
 *                   type: string
 *                   description: Warning message if API limit reached
 *                 emotional_tone:
 *                   type: object
 *                   properties:
 *                     sentiment:
 *                       type: string
 *                       enum: [POSITIVE, NEGATIVE]
 *                     confidence:
 *                       type: string
 *                       example: "85.5%"
 *                     description:
 *                       type: string
 *                 symbols_detected:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                       meaning:
 *                         type: string
 *                       sentiment:
 *                         type: string
 *                         enum: [positive, negative, neutral]
 *                 ai_interpretation:
 *                   type: string
 *                 personalized_advice:
 *                   type: string
 *                 analysis_summary:
 *                   type: string
 *                 api_calls_used:
 *                   type: integer
 *                 api_calls_remaining:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       503:
 *         description: AI model not loaded
 *       500:
 *         description: Server error
 */
router.post('/interpret', authMiddleware, async (req: Request<{}, {}, InterpretBody>, res: Response) => {
  try {
    const { dream_text } = req.body;

    if (!dream_text || typeof dream_text !== 'string') {
      res.status(400).json({
        error: messages.dreams.interpret.textRequired
      });
      return;
    }

    const trimmedDream = dream_text.trim();

    if (trimmedDream.length < 10) {
      res.status(400).json({
        error: messages.dreams.interpret.textTooShort
      });
      return;
    }

    if (trimmedDream.length > 5000) {
      res.status(400).json({
        error: messages.dreams.interpret.textTooLong
      });
      return;
    }

    if (!modelsReady()) {
      res.status(503).json({
        error: messages.dreams.interpret.modelsLoading
      });
      return;
    }

    // Increment API calls and get warning if needed
    const { calls_used, calls_remaining, warning } = await incrementApiCalls(req.user!.userId);

    console.log(`Interpreting dream for user ${req.user!.userId} (${req.user!.email})...`);
    const analysis = await interpretDream(trimmedDream);
    
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

    for (const symbol of analysis.symbols_detected as SymbolType[]) {
      try {
        // Use symbol.name for database (not the emoji), fallback to symbol.symbol for compatibility
        const symbolName = getSymbolName(symbol);
        const existingSymbol = await prisma.dreamSymbol.findUnique({
          where: {
            user_id_symbol: {
              user_id: req.user!.userId,
              symbol: symbolName
            }
          }
        });

        if (existingSymbol) {
          // Use increment to avoid potential schema issues
          await prisma.dreamSymbol.update({
            where: { id: existingSymbol.id },
            data: { 
              frequency: { increment: 1 }
            }
          });
        } else {
          await prisma.dreamSymbol.create({
            data: {
              user_id: req.user!.userId,
              symbol: symbolName,
              frequency: 1
            }
          });
        }
      } catch (symbolError) {
        const symbolName = getSymbolName(symbol);
        console.error(`Error updating symbol ${symbolName}:`, symbolError);
      }
    }

    console.log(`Dream interpreted successfully for ${req.user!.email}`);
    const response = {
      ...(warning ? { warning } : {}),
      emotional_tone: analysis.emotional_tone,
      symbols_detected: analysis.symbols_detected,
      ai_interpretation: analysis.ai_interpretation,
      personalized_advice: analysis.personalized_advice,
      analysis_summary: analysis.analysis_summary,
      api_calls_used: calls_used,
      api_calls_remaining: calls_remaining
    };

    res.json(response);

  } catch (error) {
    console.error('Dream interpretation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error message:', errorMessage);
    if (errorStack) console.error('Error stack:', errorStack);
    
    res.status(500).json({
      error: messages.dreams.interpret.failed,
      ...(process.env.NODE_ENV === 'development' && {
        details: errorMessage,
        stack: errorStack
      })
    });
  }
});

/**
 * @swagger
 * /api/v1/dreams/history:
 *   get:
 *     summary: Get user's dream history
 *     tags: [Dreams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of dreams to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of dreams to skip
 *     responses:
 *       200:
 *         description: Dream history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dreams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       dream_text:
 *                         type: string
 *                       sentiment:
 *                         type: string
 *                       symbols:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             symbol:
 *                               type: string
 *                             meaning:
 *                               type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
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

    const dreams = dreamsResult.map((dream: { id: number; dream_text: string; sentiment: string | null; symbols: unknown; created_at: Date }) => ({
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

/**
 * @swagger
 * /api/v1/dreams/stats:
 *   get:
 *     summary: Get user's dream statistics and API usage
 *     tags: [Dreams]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api_calls_used:
 *                   type: integer
 *                   example: 15
 *                 api_calls_remaining:
 *                   type: integer
 *                   example: 5
 *                 total_dreams:
 *                   type: integer
 *                 recurring_symbols:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                       frequency:
 *                         type: integer
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { api_calls_used: true }
    });

    if (!user) {
      res.status(404).json({ error: messages.dreams.stats.userNotFound });
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

    const calls_used = user.api_calls_used;
    const calls_remaining = Math.max(0, FREE_API_CALLS_LIMIT - calls_used);

    res.json({
      api_calls_used: calls_used,
      api_calls_remaining: calls_remaining,
      total_dreams: dreamCount,
      recurring_symbols: recurringSymbols
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: messages.dreams.stats.failed
    });
  }
});

/**
 * @swagger
 * /api/v1/dreams/{id}:
 *   get:
 *     summary: Get a specific dream by ID
 *     tags: [Dreams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dream ID
 *     responses:
 *       200:
 *         description: Dream retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dream:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     dream_text:
 *                       type: string
 *                     sentiment:
 *                       type: string
 *                     symbols:
 *                       type: array
 *                     created_at:
 *                       type: string
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Dream not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dreamId = parseInt(req.params.id);
    
    if (isNaN(dreamId)) {
      res.status(400).json({
        error: messages.general.numberRequired
      });
      return;
    }

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

/**
 * @swagger
 * /api/v1/dreams/{id}:
 *   put:
 *     summary: Update a dream's text
 *     tags: [Dreams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dream ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dream_text
 *             properties:
 *               dream_text:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 example: "Updated dream text here"
 *     responses:
 *       200:
 *         description: Dream updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Dream not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, async (req: Request<{ id: string }, {}, UpdateDreamBody>, res: Response) => {
  try {
    const dreamId = parseInt(req.params.id);
    
    if (isNaN(dreamId)) {
      res.status(400).json({
        error: messages.general.numberRequired
      });
      return;
    }

    const { dream_text } = req.body;

    if (!dream_text || typeof dream_text !== 'string') {
      res.status(400).json({
        error: messages.dreams.update.textRequired
      });
      return;
    }

    const trimmedDream = dream_text.trim();

    if (trimmedDream.length < 10) {
      res.status(400).json({
        error: messages.dreams.update.textTooShort
      });
      return;
    }

    if (trimmedDream.length > 5000) {
      res.status(400).json({
        error: messages.dreams.update.textTooLong
      });
      return;
    }

    // Check if dream exists and belongs to user
    const existingDream = await prisma.dream.findFirst({
      where: {
        id: dreamId,
        user_id: req.user!.userId
      }
    });

    if (!existingDream) {
      res.status(404).json({
        error: messages.dreams.update.notFound
      });
      return;
    }

    // Update the dream
    await prisma.dream.update({
      where: { id: dreamId },
      data: {
        dream_text: trimmedDream
      }
    });

    res.json({
      success: true,
      message: messages.dreams.update.success
    });

  } catch (error) {
    console.error('Dream update error:', error);
    res.status(500).json({
      error: messages.dreams.update.failed
    });
  }
});

/**
 * @swagger
 * /api/v1/dreams/{id}:
 *   delete:
 *     summary: Delete a dream
 *     tags: [Dreams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dream ID
 *     responses:
 *       200:
 *         description: Dream deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Dream not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dreamId = parseInt(req.params.id);
    
    if (isNaN(dreamId)) {
      res.status(400).json({
        error: messages.general.numberRequired
      });
      return;
    }

    const dream = await prisma.dream.deleteMany({
      where: {
        id: dreamId,
        user_id: req.user!.userId
      }
    });

    if (dream.count === 0) {
      res.status(404).json({
        error: messages.dreams.delete.notFound
      });
      return;
    }

    res.json({
      success: true,
      message: messages.dreams.delete.success
    });

  } catch (error) {
    console.error('Dream deletion error:', error);
    res.status(500).json({
      error: messages.dreams.delete.failed
    });
  }
});

export default router;

