import Redis from 'ioredis';
import { logger } from './logger.js';

export class RedisSubscriber {
  private subscriber: Redis | null = null;
  private messageCallback: ((channel: string, message: string) => void) | null = null;
  private subscribedChannels: Set<string> = new Set();

  async connect() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.subscriber = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.subscriber.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error:', error);
    });

    this.subscriber.on('message', (channel, message) => {
      if (this.messageCallback) {
        this.messageCallback(channel, message);
      }
    });
  }

  async disconnect() {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }

  subscribe(channel: string) {
    if (this.subscriber && !this.subscribedChannels.has(channel)) {
      this.subscriber.subscribe(channel);
      this.subscribedChannels.add(channel);
      logger.debug(`Subscribed to channel: ${channel}`);
    }
  }

  unsubscribe(channel: string) {
    if (this.subscriber && this.subscribedChannels.has(channel)) {
      this.subscriber.unsubscribe(channel);
      this.subscribedChannels.delete(channel);
      logger.debug(`Unsubscribed from channel: ${channel}`);
    }
  }

  onMessage(callback: (channel: string, message: string) => void) {
    this.messageCallback = callback;
  }
}

export class RedisPublisher {
  private publisher: Redis | null = null;

  async connect() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.publisher = new Redis(redisUrl);

    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });

    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error:', error);
    });
  }

  async disconnect() {
    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = null;
    }
  }

  async publish(channel: string, message: unknown) {
    if (this.publisher) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      await this.publisher.publish(channel, payload);
    }
  }
}
