import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@market-predict/database';
import { authenticate } from '../lib/auth.js';
import { AppError } from '../lib/error-handler.js';

const updateUserSchema = z.object({
  username: z.string().min(2).max(30).optional(),
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [authenticate] }, async (request) => {
    const { userId } = request.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        balance: true,
        reputationScore: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return { success: true, data: user };
  });

  app.patch('/me', { preHandler: [authenticate] }, async (request) => {
    const { userId } = request.user;
    const body = updateUserSchema.parse(request.body);

    if (body.username) {
      const existing = await prisma.user.findUnique({
        where: { username: body.username },
      });
      if (existing && existing.id !== userId) {
        throw AppError.conflict('Username already taken');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        balance: true,
        reputationScore: true,
        role: true,
        createdAt: true,
      },
    });

    return { success: true, data: user };
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        reputationScore: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return { success: true, data: user };
  });

  app.get('/me/positions', { preHandler: [authenticate] }, async (request) => {
    const { userId } = request.user;

    const positions = await prisma.position.findMany({
      where: {
        userId,
        OR: [
          { yesShares: { gt: 0 } },
          { noShares: { gt: 0 } },
        ],
      },
      include: {
        market: {
          select: {
            id: true,
            question: true,
            probability: true,
            status: true,
            outcome: true,
            closesAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { success: true, data: positions };
  });

  app.get('/me/trades', { preHandler: [authenticate] }, async (request) => {
    const { userId } = request.user;
    const { limit = '20', offset = '0' } = request.query as {
      limit?: string;
      offset?: string;
    };

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { userId },
        include: {
          market: {
            select: {
              id: true,
              question: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.trade.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: trades,
      meta: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    };
  });
}
