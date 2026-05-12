import { z } from 'zod';
import { IdSchema, TimestampsSchema } from './common';

export const AIPriorSchema = z.object({
  id: IdSchema,
  marketId: IdSchema,
  probability: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string(),
  features: z.record(z.unknown()),
  explanation: z.string().nullable(),
  ...TimestampsSchema.shape,
});

export type AIPrior = z.infer<typeof AIPriorSchema>;

export const GeneratePriorRequestSchema = z.object({
  marketId: IdSchema,
  contentId: IdSchema.optional(),
  category: z.string(),
  question: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type GeneratePriorRequest = z.infer<typeof GeneratePriorRequestSchema>;

export const GeneratePriorResponseSchema = z.object({
  probability: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  features: z.record(z.unknown()),
  explanation: z.string(),
  modelVersion: z.string(),
});

export type GeneratePriorResponse = z.infer<typeof GeneratePriorResponseSchema>;

export const SentimentAnalysisSchema = z.object({
  score: z.number().min(-1).max(1),
  magnitude: z.number().nonnegative(),
  sources: z.array(z.object({
    platform: z.string(),
    score: z.number(),
    sampleSize: z.number(),
  })),
});

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

export const TrendSignalSchema = z.object({
  id: IdSchema,
  contentId: IdSchema.nullable(),
  marketId: IdSchema.nullable(),
  signalType: z.enum(['SPIKE', 'DECLINE', 'ANOMALY', 'VIRAL']),
  platform: z.string(),
  metric: z.string(),
  value: z.number(),
  change: z.number(),
  significance: z.number().min(0).max(1),
  detectedAt: z.date(),
});

export type TrendSignal = z.infer<typeof TrendSignalSchema>;

export interface AIModelInfo {
  name: string;
  version: string;
  lastTrainedAt: Date;
  accuracy: number;
  features: string[];
}

export interface AIHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  models: AIModelInfo[];
  lastPredictionAt: Date;
  avgLatencyMs: number;
}
