import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@market-predict/database';
import { AppError } from '../../lib/error-handler.js';

export async function marketsAdminRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const {
      category,
      status,
      limit = '20',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request.query as {
      category?: string;
      status?: string;
      limit?: string;
      offset?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const where = {
      ...(category && { category: category as never }),
      ...(status && { status: status as never }),
    };

    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        include: {
          content: {
            select: { id: true, title: true, imageUrl: true },
          },
          creator: {
            select: { id: true, username: true, displayName: true },
          },
          _count: {
            select: { trades: true, positions: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.market.count({ where }),
    ]);

    return {
      success: true,
      data: markets,
      meta: { total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    };
  });

  app.get('/pending-review', async () => {
    const markets = await prisma.market.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        content: {
          select: { id: true, title: true, imageUrl: true },
        },
        creator: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, data: markets };
  });

  app.patch('/:id/approve', async (request) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user;

    const market = await prisma.market.findUnique({ where: { id } });
    if (!market) {
      throw AppError.notFound('Market not found');
    }

    await prisma.$transaction([
      prisma.market.update({
        where: { id },
        data: { status: 'ACTIVE' },
      }),
      prisma.moderationLog.create({
        data: {
          moderatorId: userId,
          targetType: 'MARKET',
          targetId: id,
          action: 'APPROVE',
        },
      }),
    ]);

    return { success: true, message: 'Market approved' };
  });

  app.patch('/:id/reject', async (request) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user;
    const { reason } = request.body as { reason?: string };

    const market = await prisma.market.findUnique({ where: { id } });
    if (!market) {
      throw AppError.notFound('Market not found');
    }

    await prisma.$transaction([
      prisma.market.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.moderationLog.create({
        data: {
          moderatorId: userId,
          targetType: 'MARKET',
          targetId: id,
          action: 'REJECT',
          reason,
        },
      }),
    ]);

    return { success: true, message: 'Market rejected' };
  });

  app.patch('/:id/pause', async (request) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user;
    const { reason } = request.body as { reason?: string };

    await prisma.$transaction([
      prisma.market.update({
        where: { id },
        data: { status: 'PAUSED' },
      }),
      prisma.moderationLog.create({
        data: {
          moderatorId: userId,
          targetType: 'MARKET',
          targetId: id,
          action: 'FLAG',
          reason,
        },
      }),
    ]);

    return { success: true, message: 'Market paused' };
  });

  app.patch('/:id/resume', async (request) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user;

    await prisma.$transaction([
      prisma.market.update({
        where: { id },
        data: { status: 'ACTIVE' },
      }),
      prisma.moderationLog.create({
        data: {
          moderatorId: userId,
          targetType: 'MARKET',
          targetId: id,
          action: 'UNFLAG',
        },
      }),
    ]);

    return { success: true, message: 'Market resumed' };
  });
}
