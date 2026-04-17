import app, { redisClient } from './app.ts';
import logger from './config/logger.ts';
import { close3DModelQueue } from './queues/model.queue.ts';
import { closeProductImageQueue } from './queues/Image.queue.ts';
import { createServer } from 'node:http';
import {
  closeSocketServer,
  initializeSocketServer,
} from './socket/socket.server.ts';

const PORT = process.env.PORT || 8000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis');
  })
  .catch(err => {
    logger.error(`Failed to connect to Redis: ${String(err)}`);
  });

const httpServer = createServer(app);
initializeSocketServer(httpServer);

const server = httpServer.listen(PORT, () => {
  logger.info(`Server is running at http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down API server`);

  server.close(async () => {
    try {
      await Promise.all([
        close3DModelQueue(),
        closeProductImageQueue(),
        closeSocketServer(),
      ]);

      if (redisClient.isOpen) {
        await redisClient.quit();
      }

      logger.info('API server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error(`API shutdown failed: ${String(error)}`);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced API shutdown timeout reached');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
