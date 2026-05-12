import { FastifyInstance } from 'fastify';
import { prisma } from '@market-predict/database';
import { isAdmin, isModerator } from '../../lib/auth.js';
import { usersAdminRoutes } from './users.js';
import { marketsAdminRoutes } from './markets.js';
import { analyticsAdminRoutes } from './analytics.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', isAdmin);

  await app.register(usersAdminRoutes, { prefix: '/users' });
  await app.register(marketsAdminRoutes, { prefix: '/markets' });
  await app.register(analyticsAdminRoutes, { prefix: '/analytics' });

  app.get('/dashboard', async () => {
    const [
      userStats,
      marketStats,
      tradeStats,
      contentStats,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.market.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(cost::numeric), 0) as volume
        FROM trades
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      ` as Promise<{ total: number; volume: number }[]>,
      prisma.content.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newUsersToday, newUsersWeek] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        users: {
          total: userStats.reduce((acc, s) => acc + s._count, 0),
          active: userStats.find((s) => s.status === 'ACTIVE')?._count || 0,
          newToday: newUsersToday,
          newThisWeek: newUsersWeek,
        },
        markets: {
          total: marketStats.reduce((acc, s) => acc + s._count, 0),
          active: marketStats.find((s) => s.status === 'ACTIVE')?._count || 0,
          pendingReview: marketStats.find((s) => s.status === 'PENDING_REVIEW')?._count || 0,
          resolved: marketStats.find((s) => s.status === 'RESOLVED')?._count || 0,
        },
        trades: {
          total: Number(tradeStats[0]?.total) || 0,
          volume24h: Number(tradeStats[0]?.volume) || 0,
        },
        content: {
          total: contentStats.reduce((acc, s) => acc + s._count, 0),
          pendingReview: contentStats.find((s) => s.status === 'PENDING')?._count || 0,
          approved: contentStats.find((s) => s.status === 'APPROVED')?._count || 0,
        },
      },
    };
  });

  app.get('/menus', async () => {
    const menus = await prisma.menuItem.findMany({
      where: { isEnabled: true },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });

    const buildTree = (items: typeof menus, parentId: string | null = null): unknown[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    return {
      success: true,
      data: buildTree(menus),
    };
  });
}
