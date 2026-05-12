import { z } from 'zod';
import { IdSchema, TimestampsSchema } from './common';

export const MarketStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'PAUSED',
  'CLOSED',
  'RESOLVED',
  'CANCELLED',
]);
export type MarketStatus = z.infer<typeof MarketStatusSchema>;

export const MarketOutcomeSchema = z.enum(['YES', 'NO', 'CANCELLED', 'PENDING']);
export type MarketOutcome = z.infer<typeof MarketOutcomeSchema>;

export const MarketCategorySchema = z.enum([
  'KPOP',
  'MOVIE',
  'DRAMA',
  'TV_SHOW',
  'BEAUTY',
  'CONSUMER',
  'VIRAL',
  'OTHER',
]);
export type MarketCategory = z.infer<typeof MarketCategorySchema>;

export const MarketSchema = z.object({
  id: IdSchema,
  contentId: IdSchema.nullable(),
  question: z.string().min(10).max(500),
  description: z.string().max(2000).nullable(),
  category: MarketCategorySchema,
  probability: z.number().min(0).max(1),
  liquidityParam: z.number().positive(),
  yesShares: z.number().nonnegative(),
  noShares: z.number().nonnegative(),
  volume: z.number().nonnegative(),
  status: MarketStatusSchema,
  outcome: MarketOutcomeSchema,
  resolutionTime: z.date().nullable(),
  closesAt: z.date(),
  resolvedAt: z.date().nullable(),
  resolutionSource: z.string().nullable(),
  createdBy: IdSchema,
  ...TimestampsSchema.shape,
});

export type Market = z.infer<typeof MarketSchema>;

export const MarketWithStatsSchema = MarketSchema.extend({
  tradeCount: z.number().int().nonnegative(),
  uniqueTraders: z.number().int().nonnegative(),
  aiPrior: z.number().min(0).max(1).nullable(),
  aiConfidence: z.number().min(0).max(1).nullable(),
  priceChange24h: z.number(),
  volumeChange24h: z.number(),
});

export type MarketWithStats = z.infer<typeof MarketWithStatsSchema>;

export const CreateMarketSchema = z.object({
  contentId: IdSchema.optional(),
  question: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  category: MarketCategorySchema,
  initialProbability: z.number().min(0.01).max(0.99).default(0.5),
  liquidityParam: z.number().positive().default(100),
  closesAt: z.date(),
});

export type CreateMarket = z.infer<typeof CreateMarketSchema>;

export const UpdateMarketSchema = z.object({
  question: z.string().min(10).max(500).optional(),
  description: z.string().max(2000).optional(),
  category: MarketCategorySchema.optional(),
  status: MarketStatusSchema.optional(),
  closesAt: z.date().optional(),
});

export type UpdateMarket = z.infer<typeof UpdateMarketSchema>;

export const ResolveMarketSchema = z.object({
  outcome: z.enum(['YES', 'NO', 'CANCELLED']),
  resolutionSource: z.string().min(1).max(500),
});

export type ResolveMarket = z.infer<typeof ResolveMarketSchema>;

export interface MarketPricePoint {
  timestamp: Date;
  probability: number;
  volume: number;
}

export interface MarketPriceHistory {
  marketId: string;
  points: MarketPricePoint[];
}
