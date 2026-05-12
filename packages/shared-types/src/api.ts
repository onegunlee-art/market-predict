import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'CONFLICT',
  'INTERNAL_ERROR',
  'RATE_LIMITED',
  'INSUFFICIENT_BALANCE',
  'MARKET_CLOSED',
  'MARKET_RESOLVED',
  'INVALID_TRADE',
  'SERVICE_UNAVAILABLE',
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: string;
}

export type WSMessageType =
  | 'market_update'
  | 'trade'
  | 'position_update'
  | 'notification'
  | 'ai_signal'
  | 'price_history'
  | 'error'
  | 'ping'
  | 'pong';

export interface MarketUpdatePayload {
  marketId: string;
  probability: number;
  yesShares: number;
  noShares: number;
  volume: number;
  lastTradeAt: string;
}

export interface TradePayload {
  tradeId: string;
  marketId: string;
  userId: string;
  side: 'YES' | 'NO';
  shares: number;
  cost: number;
  probabilityAfter: number;
}

export interface NotificationPayload {
  id: string;
  type: 'TRADE_EXECUTED' | 'MARKET_RESOLVED' | 'BALANCE_UPDATED' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AISignalPayload {
  marketId: string;
  newPrior: number;
  previousPrior: number;
  confidence: number;
  reason: string;
}

export interface WSSubscribeMessage {
  type: 'subscribe';
  channels: string[];
}

export interface WSUnsubscribeMessage {
  type: 'unsubscribe';
  channels: string[];
}

export type WSClientMessage = WSSubscribeMessage | WSUnsubscribeMessage | { type: 'ping' };
