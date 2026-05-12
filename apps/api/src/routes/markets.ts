import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@market-predict/database';
import { MarketEngine } from '@market-predict/market-engine';
import { authenticate, isAdmin } from '../lib/auth.js';
import { AppError } from '../lib/error-handler.js';

const createMarketSchema = z.object({
  contentId: z.string().uuid().optional(),
  question: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  category: z.enum(['KPOP', 'MOVIE', 'DRAMA', 'TV_SHOW', 'BEAUTY', 'CONSUMER', 'VIRAL', 'OTHER']),
  initialProbability: z.number().min(0.01).max(0.99).default(0.5),
  liquidityParam: z.number().positive().default(100),
  closesAt: z.string().datetime(),
});

const updateMarketSchema = z.object({
  question: z.string().min(10).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'CLOSED']).optional(),
});

const resolveMarketSchema = z.object({
  outcome: z.enum(['YES', 'NO', 'CANCELLED']),
  resolutionSource: z.string().min(1).max(500),
});

const marketEngine = new MarketEngine();

export async function marketRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const {
      category,
      status = 'ACTIVE',
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
      ...(status && { status: status as never }),
      ...(category && { category: category as never }),
    };

    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        include: {
          content: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              thumbnailUrl: true,
            },
          },
          _count: {
            select: { trades: true },
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
      meta: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    };
  });

  app.get('/trending', async () => {
    const markets = await prisma.market.findMany({
      where: { status: 'ACTIVE' },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        _count: { select: { trades: true } },
      },
      orderBy: { volume: 'desc' },
      take: 10,
    });

    return { success: true, data: markets };
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };

    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        content: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        aiPriors: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { trades: true, positions: true },
        },
      },
    });

    if (!market) {
      throw AppError.notFound('Market not found');
    }

    return { success: true, data: market };
  });

  app.post('/', { preHandler: [authenticate, isAdmin] }, async (request, reply) => {
    const { userId } = request.user;
    const body = createMarketSchema.parse(request.body);

    const initialState = marketEngine.initializeMarket(body.initialProbability);

    const market = await prisma.market.create({
      data: {
        contentId: body.contentId,
        question: body.question,
        description: body.description,
        category: body.category,
        probability: body.initialProbability,
        liquidityParam: body.liquidityParam,
        yesShares: initialState.yesShares,
        noShares: initialState.noShares,
        closesAt: new Date(body.closesAt),
        createdBy: userId,
        status: 'ACTIVE',
      },
      include: {
        content: true,
      },
    });

    return reply.status(201).send({
      success: true,
      data: market,
    });
  });

  app.patch('/:id', { preHandler: [authenticate, isAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = updateMarketSchema.parse(request.body);

    const market = await prisma.market.update({
      where: { id },
      data: body,
    });

    return { success: true, data: market };
  });

  app.post('/:id/resolve', { preHandler: [authenticate, isAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = resolveMarketSchema.parse(request.body);

    const market = await prisma.market.findUnique({
      where: { id },
    });

    if (!market) {
      throw AppError.notFound('Market not found');
    }

    if (market.status === 'RESOLVED') {
      throw AppError.badRequest('Market already resolved');
    }

    const positions = await prisma.position.findMany({
      where: { marketId: id },
    });

    const payouts = marketEngine.calculateResolutionPayouts(
      positions.map((p) => ({
        userId: p.userId,
        yesShares: Number(p.yesShares),
        noShares: Number(p.noShares),
      })),
      body.outcome
    );

    await prisma.$transaction(async (tx) => {
      await tx.market.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          outcome: body.outcome,
          resolutionSource: body.resolutionSource,
          resolvedAt: new Date(),
        },
      });

      for (const payout of payouts) {
        if (payout.payout > 0) {
          await tx.user.update({
            where: { id: payout.userId },
            data: {
              balance: { increment: payout.payout },
            },
          });
        }
      }
    });

    return {
      success: true,
      data: { marketId: id, outcome: body.outcome, payouts },
    };
  });

  app.get('/:id/trades', async (request) => {
    const { id } = request.params as { id: string };
    const { limit = '20', offset = '0' } = request.query as {
      limit?: string;
      offset?: string;
    };

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { marketId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.trade.count({ where: { marketId: id } }),
    ]);

    return {
      success: true,
      data: trades,
      meta: { total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    };
  });
}
