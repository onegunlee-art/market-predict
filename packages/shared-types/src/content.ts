import { z } from 'zod';
import { IdSchema, TimestampsSchema } from './common';
import { MarketCategorySchema } from './market';

export const ContentStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ContentSourceTypeSchema = z.enum([
  'TMDB',
  'YOUTUBE',
  'SPOTIFY',
  'TIKTOK',
  'IMDB',
  'MANUAL',
  'OTHER',
]);
export type ContentSourceType = z.infer<typeof ContentSourceTypeSchema>;

export const ContentSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(500),
  originalTitle: z.string().max(500).nullable(),
  description: z.string().max(5000).nullable(),
  imageUrl: z.string().url().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  category: MarketCategorySchema,
  sourceType: ContentSourceTypeSchema,
  sourceId: z.string().nullable(),
  sourceUrl: z.string().url().nullable(),
  releaseDate: z.date().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  status: ContentStatusSchema,
  reviewedBy: IdSchema.nullable(),
  reviewedAt: z.date().nullable(),
  ...TimestampsSchema.shape,
});

export type Content = z.infer<typeof ContentSchema>;

export const CreateContentSchema = z.object({
  title: z.string().min(1).max(500),
  originalTitle: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  category: MarketCategorySchema,
  sourceType: ContentSourceTypeSchema.default('MANUAL'),
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  releaseDate: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateContent = z.infer<typeof CreateContentSchema>;

export const IngestContentSchema = z.object({
  url: z.string().url(),
  category: MarketCategorySchema.optional(),
});

export type IngestContent = z.infer<typeof IngestContentSchema>;

export const IngestionJobStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
export type IngestionJobStatus = z.infer<typeof IngestionJobStatusSchema>;

export const IngestionJobSchema = z.object({
  id: IdSchema,
  url: z.string().url(),
  sourceType: ContentSourceTypeSchema,
  status: IngestionJobStatusSchema,
  contentId: IdSchema.nullable(),
  error: z.string().nullable(),
  createdBy: IdSchema,
  ...TimestampsSchema.shape,
});

export type IngestionJob = z.infer<typeof IngestionJobSchema>;

export interface ContentWithMarkets extends Content {
  markets: {
    id: string;
    question: string;
    probability: number;
    status: string;
  }[];
}
