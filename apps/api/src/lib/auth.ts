import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '@market-predict/database';
import { UserRole } from '@market-predict/shared-types';
import { AppError } from './error-handler.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      role: UserRole;
    };
    user: {
      userId: string;
      role: UserRole;
    };
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(
  app: FastifyInstance,
  userId: string,
  role: UserRole
) {
  const accessToken = app.jwt.sign(
    { userId, role },
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = app.jwt.sign(
    { userId, role, type: 'refresh' },
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}

export async function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    const user = request.user;
    if (!roles.includes(user.role as UserRole)) {
      throw AppError.forbidden('Insufficient permissions');
    }
  };
}

export async function getCurrentUser(request: FastifyRequest) {
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

  return user;
}

export const isAdmin = requireRole('SUPER_ADMIN', 'ADMIN');
export const isModerator = requireRole('SUPER_ADMIN', 'ADMIN', 'MODERATOR');
export const isAnalyst = requireRole('SUPER_ADMIN', 'ADMIN', 'ANALYST');
