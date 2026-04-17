import 'dotenv/config';
import logger from '#src/config/logger.ts';
import {
  closeProductImageEditWorker,
  productImageEditWorker,
} from '#src/workers/image/Image.worker.ts';

let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`[BullMQ] Worker shutdown signal received: ${signal}`);

  try {
    await Promise.all([closeProductImageEditWorker()]);
    logger.info('[BullMQ] Worker closed cleanly');
    process.exit(0);
  } catch (error) {
    logger.error(`[BullMQ] Worker shutdown failed: ${String(error)}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

const startWorkers = async () => {
  try {
    await productImageEditWorker.waitUntilReady();
    logger.info('[BullMQ] Product image edit worker is running');
  } catch (error: unknown) {
    logger.error(`[BullMQ] Worker failed to start: ${String(error)}`);
    process.exit(1);
  }
};

void startWorkers();
