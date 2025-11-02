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

// Get all users (admin only)
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

// Get analytics (admin only)
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

// Get user details (admin only)
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

// Get recent activity (admin only)
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

