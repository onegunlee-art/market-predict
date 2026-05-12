import 'dotenv/config';
import { buildApp } from './app.js';
import { logger } from './lib/logger.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: PORT, host: HOST });

    logger.info(`🚀 API Server running at http://${HOST}:${PORT}`);
    logger.info(`📚 API Docs available at http://${HOST}:${PORT}/docs`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
