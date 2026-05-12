import { WebSocket } from 'ws';
import { generateId } from '@market-predict/utils';

interface Connection {
  ws: WebSocket;
  userId: string | null;
  channels: Set<string>;
  connectedAt: Date;
}

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private channelSubscribers: Map<string, Set<string>> = new Map();

  addConnection(ws: WebSocket, userId: string | null): string {
    const connectionId = generateId();

    this.connections.set(connectionId, {
      ws,
      userId,
      channels: new Set(),
      connectedAt: new Date(),
    });

    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }

    return connectionId;
  }

  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    for (const channel of connection.channels) {
      this.unsubscribeFromChannel(connectionId, channel);
    }

    if (connection.userId) {
      const userConns = this.userConnections.get(connection.userId);
      if (userConns) {
        userConns.delete(connectionId);
        if (userConns.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
    }

    this.connections.delete(connectionId);
  }

  getConnection(connectionId: string): WebSocket | null {
    return this.connections.get(connectionId)?.ws || null;
  }

  subscribeToChannel(connectionId: string, channel: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.channels.add(channel);

    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(connectionId);
  }

  unsubscribeFromChannel(connectionId: string, channel: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.channels.delete(channel);

    const subscribers = this.channelSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channel);
      }
    }
  }

  getChannelSubscribers(channel: string): WebSocket[] {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers) return [];

    const websockets: WebSocket[] = [];
    for (const connectionId of subscribers) {
      const ws = this.getConnection(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        websockets.push(ws);
      }
    }
    return websockets;
  }

  getUserConnections(userId: string): WebSocket[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];

    const websockets: WebSocket[] = [];
    for (const connectionId of connectionIds) {
      const ws = this.getConnection(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        websockets.push(ws);
      }
    }
    return websockets;
  }

  broadcastToAll(message: string) {
    for (const [, connection] of this.connections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message);
      }
    }
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(
        (c) => c.userId !== null
      ).length,
      channelCount: this.channelSubscribers.size,
      channels: Array.from(this.channelSubscribers.entries()).map(([channel, subs]) => ({
        name: channel,
        subscribers: subs.size,
      })),
    };
  }
}
