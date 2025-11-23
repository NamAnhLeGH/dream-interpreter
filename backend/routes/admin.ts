import express, { Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { prisma } from '../config/db.js';

const router = express.Router();

interface RawQueryResult {
  symbol?: string;
  total_frequency?: bigint | number;
  sentiment?: string;
  count?: number;
  date?: Date;
  email?: string;
  dream_count?: number;
  api_calls_used?: number;
}

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with their API consumption (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       api_calls_used:
 *                         type: integer
 *                       total_dreams:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/users', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        api_calls_used: true,
        created_at: true,
        _count: {
          select: { dreams: true }
        },
        dreams: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: { created_at: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      api_calls_used: user.api_calls_used,
      created_at: user.created_at,
      total_dreams: user._count.dreams,
      last_dream_date: user.dreams[0]?.created_at || null
    }));
    
    res.json({ 
      users: formattedUsers,
      count: formattedUsers.length
    });
    
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users' 
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/endpoint-stats:
 *   get:
 *     summary: Get API endpoint usage statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Endpoint statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 endpoint_stats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       method:
 *                         type: string
 *                         example: "POST"
 *                       endpoint:
 *                         type: string
 *                         example: "/api/v1/dreams/interpret"
 *                       requests:
 *                         type: integer
 *                         example: 145
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/endpoint-stats', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const endpointStats = await prisma.apiEndpointStat.findMany({
      orderBy: [
        { request_count: 'desc' },
        { method: 'asc' },
        { endpoint: 'asc' }
      ]
    });

    res.json({
      endpoint_stats: endpointStats.map(stat => ({
        method: stat.method,
        endpoint: stat.endpoint,
        requests: stat.request_count
      }))
    });
  } catch (error) {
    console.error('Endpoint stats fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch endpoint statistics' 
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get platform analytics (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_users:
 *                   type: integer
 *                 total_dreams:
 *                   type: integer
 *                 most_common_symbols:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                       total_frequency:
 *                         type: integer
 *                 sentiment_distribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sentiment:
 *                         type: string
 *                       count:
 *                         type: integer
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/analytics', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count({
      where: { role: 'user' }
    });
    
    const totalDreams = await prisma.dream.count();
    
    const totalAPICallsResult = await prisma.user.aggregate({
      _sum: { api_calls_used: true }
    });
    
    // Complex aggregations - use raw SQL for GROUP BY
    const commonSymbolsResult = await prisma.$queryRaw<RawQueryResult[]>`
      SELECT symbol, SUM(frequency) as total_frequency 
      FROM dream_symbols 
      GROUP BY symbol 
      ORDER BY total_frequency DESC 
      LIMIT 20
    `;
    
    const sentimentDistResult = await prisma.$queryRaw<RawQueryResult[]>`
      SELECT sentiment, COUNT(*)::int as count 
      FROM dreams 
      WHERE sentiment IS NOT NULL
      GROUP BY sentiment
    `;
    
    const dreamsPerDayResult = await prisma.$queryRaw<RawQueryResult[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM dreams
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const activeUsersResult = await prisma.user.findMany({
      where: { role: 'user' },
      select: {
        email: true,
        api_calls_used: true,
        _count: {
          select: { dreams: true }
        }
      }
    });
    
    // Sort by dream count (descending) and take top 10
    const topActiveUsers = activeUsersResult
      .sort((a, b) => b._count.dreams - a._count.dreams)
      .slice(0, 10);
    
    const totalAPICalls = Number(totalAPICallsResult._sum.api_calls_used || 0);
    const avgDreamsPerUser = totalUsers > 0 
      ? (totalDreams / totalUsers).toFixed(2)
      : 0;
    
    res.json({
      total_users: totalUsers,
      total_dreams: totalDreams,
      total_api_calls: totalAPICalls,
      average_dreams_per_user: parseFloat(String(avgDreamsPerUser)),
      most_common_symbols: commonSymbolsResult.map(row => ({
        symbol: row.symbol!,
        total_frequency: Number(row.total_frequency || 0)
      })),
      sentiment_distribution: sentimentDistResult.map(row => ({
        sentiment: row.sentiment!,
        count: row.count || 0
      })),
      dreams_per_day: dreamsPerDayResult.map(row => {
        const date = row.date as Date;
        return {
          date: date ? date.toISOString().split('T')[0] : '',
          count: row.count || 0
        };
      }),
      most_active_users: topActiveUsers.map(user => ({
        email: user.email,
        dream_count: user._count.dreams,
        api_calls_used: user.api_calls_used
      }))
    });
    
  } catch (error) {
    console.error('Admin analytics fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics' 
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/user/{id}:
 *   get:
 *     summary: Get detailed information about a specific user (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/user/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        api_calls_used: true,
        created_at: true
      }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const recentDreams = await prisma.dream.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        dream_text: true,
        sentiment: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });
    
    const recurringSymbols = await prisma.dreamSymbol.findMany({
      where: { user_id: userId },
      select: {
        symbol: true,
        frequency: true
      },
      orderBy: { frequency: 'desc' }
    });
    
    res.json({
      user,
      recent_dreams: recentDreams.map(dream => ({
        ...dream,
        created_at: dream.created_at.toISOString()
      })),
      recurring_symbols: recurringSymbols
    });
    
  } catch (error) {
    console.error('Admin user detail fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user details' 
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/recent-activity:
 *   get:
 *     summary: Get recent platform activity (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of recent dreams to return
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recent_dreams:
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
 *                       created_at:
 *                         type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/recent-activity', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const recentDreams = await prisma.dream.findMany({
      select: {
        id: true,
        dream_text: true,
        sentiment: true,
        created_at: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
    
    const recentUsers = await prisma.user.findMany({
      where: { role: 'user' },
      select: {
        id: true,
        email: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
    
    res.json({
      recent_dreams: recentDreams.map(dream => ({
        id: dream.id,
        dream_text: dream.dream_text,
        sentiment: dream.sentiment,
        created_at: dream.created_at.toISOString(),
        user_email: dream.user.email
      })),
      recent_registrations: recentUsers.map(user => ({
        ...user,
        created_at: user.created_at.toISOString()
      }))
    });
    
  } catch (error) {
    console.error('Recent activity fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity' 
    });
  }
});

export default router;

