import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma } from '@market-predict/database';
import { MarketEngine } from '@market-predict/market-engine';
import { authenticate } from '../lib/auth.js';
import { AppError } from '../lib/error-handler.js';

const createTradeSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(['YES', 'NO']),
  amount: z.number().positive(),
});

const marketEngine = new MarketEngine();

export async function tradeRoutes(app: FastifyInstance) {
  app.post('/quote', { preHandler: [authenticate] }, async (request) => {
    const body = createTradeSchema.parse(request.body);

    const market = await prisma.market.findUnique({
      where: { id: body.marketId },
    });

    if (!market) {
      throw AppError.notFound('Market not found');
    }

    const marketState = {
      yesShares: Number(market.yesShares),
      noShares: Number(market.noShares),
      liquidityParam: Number(market.liquidityParam),
      probability: Number(market.probability),
      volume: Number(market.volume),
      status: market.status as 'ACTIVE',
    };

    const quote = marketEngine.getQuote(marketState, body.side, body.amount);

    return {
      success: true,
      data: {
        marketId: body.marketId,
        side: body.side,
        amount: body.amount,
        ...quote,
      },
    };
  });

  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const body = createTradeSchema.parse(request.body);

    const [user, market] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.market.findUnique({ where: { id: body.marketId } }),
    ]);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (!market) {
      throw AppError.notFound('Market not found');
    }

    if (market.status !== 'ACTIVE') {
      throw AppError.badRequest('Market is not active');
    }

    if (new Date() > market.closesAt) {
      throw AppError.badRequest('Market has closed');
    }

    const marketState = {
      yesShares: Number(market.yesShares),
      noShares: Number(market.noShares),
      liquidityParam: Number(market.liquidityParam),
      probability: Number(market.probability),
      volume: Number(market.volume),
      status: 'ACTIVE' as const,
    };

    const result = marketEngine.executeTrade(marketState, {
      userId,
      marketId: body.marketId,
      side: body.side,
      amount: body.amount,
      userBalance: Number(user.balance),
    });

    if (!result.success || !result.trade || !result.newState) {
      throw AppError.badRequest(result.error || 'Trade failed');
    }

    const trade = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: result.trade!.totalCost },
        },
      });

      await tx.market.update({
        where: { id: body.marketId },
        data: {
          yesShares: result.newState!.yesShares,
          noShares: result.newState!.noShares,
          probability: result.newState!.probability,
          volume: result.newState!.volume,
        },
      });

      const existingPosition = await tx.position.findUnique({
        where: {
          userId_marketId: {
            userId,
            marketId: body.marketId,
          },
        },
      });

      if (existingPosition) {
        const currentShares =
          body.side === 'YES'
            ? Number(existingPosition.yesShares)
            : Number(existingPosition.noShares);
        const currentAvgPrice =
          body.side === 'YES'
            ? Number(existingPosition.avgYesPrice)
            : Number(existingPosition.avgNoPrice);

        const totalShares = currentShares + result.trade!.shares;
        const newAvgPrice =
          (currentAvgPrice * currentShares +
            result.trade!.avgPrice * result.trade!.shares) /
          totalShares;

        await tx.position.update({
          where: {
            userId_marketId: {
              userId,
              marketId: body.marketId,
            },
          },
          data:
            body.side === 'YES'
              ? {
                  yesShares: { increment: result.trade!.shares },
                  avgYesPrice: newAvgPrice,
                }
              : {
                  noShares: { increment: result.trade!.shares },
                  avgNoPrice: newAvgPrice,
                },
        });
      } else {
        await tx.position.create({
          data: {
            userId,
            marketId: body.marketId,
            yesShares: body.side === 'YES' ? result.trade!.shares : 0,
            noShares: body.side === 'NO' ? result.trade!.shares : 0,
            avgYesPrice: body.side === 'YES' ? result.trade!.avgPrice : 0,
            avgNoPrice: body.side === 'NO' ? result.trade!.avgPrice : 0,
          },
        });
      }

      const newTrade = await tx.trade.create({
        data: {
          userId,
          marketId: body.marketId,
          side: body.side,
          shares: result.trade!.shares,
          cost: result.trade!.cost,
          avgPrice: result.trade!.avgPrice,
          probabilityBefore: result.trade!.probabilityBefore,
          probabilityAfter: result.trade!.probabilityAfter,
          status: 'COMPLETED',
        },
      });

      await tx.marketPricePoint.create({
        data: {
          marketId: body.marketId,
          probability: result.newState!.probability,
          volume: result.trade!.cost,
        },
      });

      return newTrade;
    });

    return reply.status(201).send({
      success: true,
      data: {
        trade,
        newProbability: result.newState.probability,
      },
    });
  });

  app.get('/my', { preHandler: [authenticate] }, async (request) => {
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
              probability: true,
              status: true,
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
      meta: { total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    };
  });
}
