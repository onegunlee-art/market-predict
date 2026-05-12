import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from './lib/logger.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { marketRoutes } from './routes/markets.js';
import { tradeRoutes } from './routes/trades.js';
import { contentRoutes } from './routes/content.js';
import { adminRoutes } from './routes/admin/index.js';
import { healthRoutes } from './routes/health.js';
import { errorHandler } from './lib/error-handler.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty' }
          : undefined,
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Market Predict API',
        description: 'Cultural Prediction Market Platform API',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:4000', description: 'Development' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.setErrorHandler(errorHandler);

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(marketRoutes, { prefix: '/api/v1/markets' });
  await app.register(tradeRoutes, { prefix: '/api/v1/trades' });
  await app.register(contentRoutes, { prefix: '/api/v1/content' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  return app;
}
