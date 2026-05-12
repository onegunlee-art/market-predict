import { WebSocket } from 'ws';
import { ConnectionManager } from './connection-manager.js';
import { logger } from './logger.js';
import type { WSMessage } from '@market-predict/shared-types';

export class MessageHandler {
  private connections: ConnectionManager;

  constructor(connections: ConnectionManager) {
    this.connections = connections;
  }

  broadcastToChannel(channel: string, message: string) {
    const subscribers = this.connections.getChannelSubscribers(channel);

    if (subscribers.length === 0) {
      return;
    }

    logger.debug(`Broadcasting to ${channel}: ${subscribers.length} subscribers`);

    for (const ws of subscribers) {
      this.sendMessage(ws, message);
    }
  }

  sendToUser(userId: string, message: WSMessage) {
    const connections = this.connections.getUserConnections(userId);
    const payload = JSON.stringify(message);

    for (const ws of connections) {
      this.sendMessage(ws, payload);
    }
  }

  broadcastMarketUpdate(marketId: string, data: {
    probability: number;
    yesShares: number;
    noShares: number;
    volume: number;
  }) {
    const message: WSMessage = {
      type: 'market_update',
      payload: {
        marketId,
        ...data,
        lastTradeAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`market:${marketId}`, JSON.stringify(message));
    this.broadcastToChannel('markets:trending', JSON.stringify(message));
  }

  broadcastTrade(marketId: string, trade: {
    tradeId: string;
    userId: string;
    side: 'YES' | 'NO';
    shares: number;
    cost: number;
    probabilityAfter: number;
  }) {
    const message: WSMessage = {
      type: 'trade',
      payload: {
        marketId,
        ...trade,
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`market:${marketId}`, JSON.stringify(message));
  }

  broadcastAISignal(marketId: string, signal: {
    newPrior: number;
    previousPrior: number;
    confidence: number;
    reason: string;
  }) {
    const message: WSMessage = {
      type: 'ai_signal',
      payload: {
        marketId,
        ...signal,
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcastToChannel(`market:${marketId}`, JSON.stringify(message));
  }

  sendNotification(userId: string, notification: {
    id: string;
    type: 'TRADE_EXECUTED' | 'MARKET_RESOLVED' | 'BALANCE_UPDATED' | 'SYSTEM';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    const message: WSMessage = {
      type: 'notification',
      payload: notification,
      timestamp: new Date().toISOString(),
    };

    this.sendToUser(userId, message);
  }

  private sendMessage(ws: WebSocket, message: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}
