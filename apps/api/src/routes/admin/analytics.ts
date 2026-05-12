import { FastifyInstance } from 'fastify';
import { prisma } from '@market-predict/database';

export async function analyticsAdminRoutes(app: FastifyInstance) {
  app.get('/overview', async (request) => {
    const { period = '7d' } = request.query as { period?: string };

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [dailyStats, volumeByCategory, topMarkets] = await Promise.all([
      prisma.dailyStats.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.market.groupBy({
        by: ['category'],
        _sum: { volume: true },
        _count: true,
        where: { createdAt: { gte: startDate } },
      }),
      prisma.market.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { volume: 'desc' },
        take: 10,
        select: {
          id: true,
          question: true,
          probability: true,
          volume: true,
          _count: { select: { trades: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        dailyStats,
        volumeByCategory,
        topMarkets,
      },
    };
  });

  app.get('/users', async (request) => {
    const { period = '7d' } = request.query as { period?: string };

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [newUsersByDay, usersByRole, topTraders] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      ` as Promise<{ date: Date; count: number }[]>,
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.findMany({
        orderBy: { reputationScore: 'desc' },
        take: 10,
        select: {
          id: true,
          username: true,
          displayName: true,
          reputationScore: true,
          _count: { select: { trades: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        newUsersByDay,
        usersByRole,
        topTraders,
      },
    };
  });

  app.get('/markets', async (request) => {
    const { period = '7d' } = request.query as { period?: string };

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [marketsByStatus, marketsByCategory, recentlyResolved] = await Promise.all([
      prisma.market.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.market.groupBy({
        by: ['category'],
        _count: true,
        _sum: { volume: true },
      }),
      prisma.market.findMany({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: startDate },
        },
        orderBy: { resolvedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          question: true,
          outcome: true,
          volume: true,
          resolvedAt: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        marketsByStatus,
        marketsByCategory,
        recentlyResolved,
      },
    };
  });

  app.get('/trades', async (request) => {
    const { period = '7d' } = request.query as { period?: string };

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [volumeByDay, tradesByDay] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(cost::numeric) as volume,
          COUNT(*) as count
        FROM trades
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      ` as Promise<{ date: Date; volume: number; count: number }[]>,
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          side,
          COUNT(*) as count
        FROM trades
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at), side
        ORDER BY date ASC
      ` as Promise<{ date: Date; side: string; count: number }[]>,
    ]);

    return {
      success: true,
      data: {
        volumeByDay,
        tradesByDay,
      },
    };
  });
}
