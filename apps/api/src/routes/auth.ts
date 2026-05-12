import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@market-predict/database';
import { hashPassword, verifyPassword, generateTokens, authenticate } from '../lib/auth.js';
import { AppError } from '../lib/error-handler.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(2).max(30),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { username: body.username }],
      },
    });

    if (existingUser) {
      throw AppError.conflict(
        existingUser.email === body.email
          ? 'Email already registered'
          : 'Username already taken'
      );
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        username: body.username,
        displayName: body.displayName || body.username,
        authProvider: 'EMAIL',
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens(app, user.id, user.role);

    return reply.status(201).send({
      success: true,
      data: {
        user,
        ...tokens,
      },
    });
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (user.status === 'BANNED') {
      throw AppError.forbidden('Account has been banned');
    }

    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Account is suspended');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens(app, user.id, user.role);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          balance: user.balance,
        },
        ...tokens,
      },
    };
  });

  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });

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

    return {
      success: true,
      data: user,
    };
  });
}
