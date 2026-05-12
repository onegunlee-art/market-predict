import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@market-predict/database';
import { AppError } from '../../lib/error-handler.js';

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
  reason: z.string().optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'ANALYST', 'VERIFIED_CREATOR', 'USER']),
});

export async function usersAdminRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const {
      search,
      role,
      status,
      limit = '20',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request.query as {
      search?: string;
      role?: string;
      status?: string;
      limit?: string;
      offset?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
          { displayName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role: role as never }),
      ...(status && { status: status as never }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          authProvider: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { trades: true, positions: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      meta: { total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    };
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trades: true, positions: true },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    const recentTrades = await prisma.trade.findMany({
      where: { userId: id },
      include: {
        market: {
          select: { id: true, question: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: {
        ...user,
        recentTrades,
      },
    };
  });

  app.patch('/:id/status', async (request) => {
    const { id } = request.params as { id: string };
    const { userId: moderatorId } = request.user;
    const body = updateUserStatusSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { status: body.status },
      }),
      prisma.moderationLog.create({
        data: {
          moderatorId,
          targetType: 'USER',
          targetId: id,
          action: body.status === 'BANNED' ? 'BAN' : body.status === 'SUSPENDED' ? 'SUSPEND' : 'UNSUSPEND',
          reason: body.reason,
        },
      }),
    ]);

    return {
      success: true,
      message: `User status updated to ${body.status}`,
    };
  });

  app.patch('/:id/role', async (request) => {
    const { id } = request.params as { id: string };
    const { userId: moderatorId, role: moderatorRole } = request.user;
    const body = updateUserRoleSchema.parse(request.body);

    if (moderatorRole !== 'SUPER_ADMIN') {
      throw AppError.forbidden('Only super admins can change user roles');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { role: body.role },
      }),
      prisma.auditLog.create({
        data: {
          userId: moderatorId,
          action: 'UPDATE_USER_ROLE',
          resource: 'users',
          resourceId: id,
          changes: {
            oldRole: user.role,
            newRole: body.role,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: `User role updated to ${body.role}`,
    };
  });

  app.get('/:id/activity', async (request) => {
    const { id } = request.params as { id: string };
    const { limit = '50' } = request.query as { limit?: string };

    const [trades, logins] = await Promise.all([
      prisma.trade.findMany({
        where: { userId: id },
        include: {
          market: {
            select: { id: true, question: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
      }),
      prisma.auditLog.findMany({
        where: {
          userId: id,
          action: { in: ['LOGIN', 'LOGOUT'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      success: true,
      data: {
        trades,
        logins,
      },
    };
  });
}
