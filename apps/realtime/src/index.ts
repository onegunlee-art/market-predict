import 'dotenv/config';
import { WebSocketServer } from './server.js';
import { logger } from './lib/logger.js';

const PORT = parseInt(process.env.WS_PORT || '4001', 10);

async function start() {
  try {
    const server = new WebSocketServer(PORT);
    await server.start();

    logger.info(`🔌 WebSocket Server running on port ${PORT}`);

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

start();
