import { z } from 'zod';
import { IdSchema, TimestampsSchema } from './common';

export const TradeSideSchema = z.enum(['YES', 'NO']);
export type TradeSide = z.infer<typeof TradeSideSchema>;

export const TradeStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export type TradeStatus = z.infer<typeof TradeStatusSchema>;

export const TradeSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  marketId: IdSchema,
  side: TradeSideSchema,
  shares: z.number().positive(),
  cost: z.number(),
  avgPrice: z.number().min(0).max(1),
  probabilityBefore: z.number().min(0).max(1),
  probabilityAfter: z.number().min(0).max(1),
  status: TradeStatusSchema,
  ...TimestampsSchema.shape,
});

export type Trade = z.infer<typeof TradeSchema>;

export const CreateTradeSchema = z.object({
  marketId: IdSchema,
  side: TradeSideSchema,
  amount: z.number().positive(),
});

export type CreateTrade = z.infer<typeof CreateTradeSchema>;

export const TradeQuoteSchema = z.object({
  marketId: IdSchema,
  side: TradeSideSchema,
  amount: z.number().positive(),
  shares: z.number().positive(),
  avgPrice: z.number().min(0).max(1),
  cost: z.number(),
  probabilityAfter: z.number().min(0).max(1),
  priceImpact: z.number(),
});

export type TradeQuote = z.infer<typeof TradeQuoteSchema>;

export const PositionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  marketId: IdSchema,
  yesShares: z.number().nonnegative(),
  noShares: z.number().nonnegative(),
  avgYesPrice: z.number().min(0).max(1),
  avgNoPrice: z.number().min(0).max(1),
  realizedPnl: z.number(),
  ...TimestampsSchema.shape,
});

export type Position = z.infer<typeof PositionSchema>;

export interface PositionWithMarket extends Position {
  market: {
    id: string;
    question: string;
    probability: number;
    status: string;
    outcome: string;
  };
  unrealizedPnl: number;
  currentValue: number;
}

export interface TradeWithDetails extends Trade {
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
  };
  market: {
    id: string;
    question: string;
  };
}
