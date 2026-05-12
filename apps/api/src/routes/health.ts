import { FastifyInstance } from 'fastify';
import { prisma } from '@market-predict/database';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  app.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        services: {
          database: 'connected',
        },
      };
    } catch {
      return reply.status(503).send({
        status: 'not ready',
        services: {
          database: 'disconnected',
        },
      });
    }
  });
}
