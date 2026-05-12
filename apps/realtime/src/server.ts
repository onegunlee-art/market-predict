import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { createServer, Server } from 'http';
import { RedisSubscriber } from './lib/redis.js';
import { ConnectionManager } from './lib/connection-manager.js';
import { MessageHandler } from './lib/message-handler.js';
import { verifyToken } from './lib/auth.js';
import { logger } from './lib/logger.js';
import type { WSMessage, WSClientMessage } from '@market-predict/shared-types';

export class WebSocketServer {
  private wss: WSServer;
  private server: Server;
  private redis: RedisSubscriber;
  private connections: ConnectionManager;
  private messageHandler: MessageHandler;
  private port: number;

  constructor(port: number) {
    this.port = port;
    this.server = createServer();
    this.wss = new WSServer({ server: this.server });
    this.redis = new RedisSubscriber();
    this.connections = new ConnectionManager();
    this.messageHandler = new MessageHandler(this.connections);

    this.setupWebSocket();
    this.setupRedisSubscriber();
  }

  private setupWebSocket() {
    this.wss.on('connection', async (ws: WebSocket, request) => {
      const url = new URL(request.url || '', `http://localhost:${this.port}`);
      const token = url.searchParams.get('token');

      let userId: string | null = null;

      if (token) {
        try {
          const payload = verifyToken(token);
          userId = payload.userId;
        } catch (error) {
          logger.warn('Invalid token provided');
        }
      }

      const connectionId = this.connections.addConnection(ws, userId);
      logger.info(`New connection: ${connectionId}, userId: ${userId || 'anonymous'}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSClientMessage;
          this.handleClientMessage(connectionId, message);
        } catch (error) {
          logger.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        this.connections.removeConnection(connectionId);
        logger.info(`Connection closed: ${connectionId}`);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for ${connectionId}:`, error);
      });

      this.sendMessage(ws, {
        type: 'notification',
        payload: {
          id: connectionId,
          type: 'SYSTEM',
          title: 'Connected',
          message: 'Successfully connected to realtime server',
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private handleClientMessage(connectionId: string, message: WSClientMessage) {
    switch (message.type) {
      case 'subscribe':
        for (const channel of message.channels) {
          this.connections.subscribeToChannel(connectionId, channel);
          this.redis.subscribe(channel);
        }
        break;

      case 'unsubscribe':
        for (const channel of message.channels) {
          this.connections.unsubscribeFromChannel(connectionId, channel);
        }
        break;

      case 'ping':
        const ws = this.connections.getConnection(connectionId);
        if (ws) {
          this.sendMessage(ws, {
            type: 'pong',
            payload: {},
            timestamp: new Date().toISOString(),
          });
        }
        break;
    }
  }

  private setupRedisSubscriber() {
    this.redis.onMessage((channel, message) => {
      this.messageHandler.broadcastToChannel(channel, message);
    });
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  async start() {
    await this.redis.connect();

    return new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  async stop() {
    this.wss.clients.forEach((client) => {
      client.close();
    });

    await this.redis.disconnect();

    return new Promise<void>((resolve) => {
      this.server.close(() => {
        resolve();
      });
    });
  }
}
