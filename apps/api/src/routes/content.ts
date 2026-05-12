import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@market-predict/database';
import { authenticate, isAdmin, isModerator } from '../lib/auth.js';
import { AppError } from '../lib/error-handler.js';

const createContentSchema = z.object({
  title: z.string().min(1).max(500),
  originalTitle: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  category: z.enum(['KPOP', 'MOVIE', 'DRAMA', 'TV_SHOW', 'BEAUTY', 'CONSUMER', 'VIRAL', 'OTHER']),
  sourceType: z.enum(['TMDB', 'YOUTUBE', 'SPOTIFY', 'TIKTOK', 'IMDB', 'MANUAL', 'OTHER']).default('MANUAL'),
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  releaseDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateContentSchema = createContentSchema.partial().extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
});

const ingestContentSchema = z.object({
  url: z.string().url(),
  category: z.enum(['KPOP', 'MOVIE', 'DRAMA', 'TV_SHOW', 'BEAUTY', 'CONSUMER', 'VIRAL', 'OTHER']).optional(),
});

export async function contentRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const {
      category,
      status,
      limit = '20',
      offset = '0',
    } = request.query as {
      category?: string;
      status?: string;
      limit?: string;
      offset?: string;
    };

    const where = {
      ...(category && { category: category as never }),
      ...(status && { status: status as never }),
    };

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          _count: { select: { markets: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.content.count({ where }),
    ]);

    return {
      success: true,
      data: contents,
      meta: { total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    };
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        markets: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            question: true,
            probability: true,
            status: true,
          },
        },
      },
    });

    if (!content) {
      throw AppError.notFound('Content not found');
    }

    return { success: true, data: content };
  });

  app.post('/', { preHandler: [authenticate, isAdmin] }, async (request, reply) => {
    const body = createContentSchema.parse(request.body);

    const content = await prisma.content.create({
      data: {
        ...body,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        status: 'PENDING',
      },
    });

    return reply.status(201).send({
      success: true,
      data: content,
    });
  });

  app.patch('/:id', { preHandler: [authenticate, isAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user;
    const body = updateContentSchema.parse(request.body);

    const updateData: Record<string, unknown> = { ...body };

    if (body.releaseDate) {
      updateData.releaseDate = new Date(body.releaseDate);
    }

    if (body.status === 'APPROVED' || body.status === 'REJECTED') {
      updateData.reviewedBy = userId;
      updateData.reviewedAt = new Date();
    }

    const content = await prisma.content.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: content };
  });

  app.post('/ingest', { preHandler: [authenticate, isAdmin] }, async (request, reply) => {
    const { userId } = request.user;
    const body = ingestContentSchema.parse(request.body);

    const job = await prisma.ingestionJob.create({
      data: {
        url: body.url,
        sourceType: detectSourceType(body.url),
        status: 'PENDING',
        createdBy: userId,
      },
    });

    return reply.status(202).send({
      success: true,
      data: {
        jobId: job.id,
        status: 'PENDING',
        message: 'Ingestion job created',
      },
    });
  });

  app.get('/jobs/:id', { preHandler: [authenticate, isAdmin] }, async (request) => {
    const { id } = request.params as { id: string };

    const job = await prisma.ingestionJob.findUnique({
      where: { id },
      include: {
        content: true,
      },
    });

    if (!job) {
      throw AppError.notFound('Ingestion job not found');
    }

    return { success: true, data: job };
  });
}

function detectSourceType(url: string): 'TMDB' | 'YOUTUBE' | 'SPOTIFY' | 'TIKTOK' | 'IMDB' | 'MANUAL' | 'OTHER' {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes('themoviedb.org') || hostname.includes('tmdb.org')) {
    return 'TMDB';
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'YOUTUBE';
  }
  if (hostname.includes('spotify.com')) {
    return 'SPOTIFY';
  }
  if (hostname.includes('tiktok.com')) {
    return 'TIKTOK';
  }
  if (hostname.includes('imdb.com')) {
    return 'IMDB';
  }

  return 'OTHER';
}
