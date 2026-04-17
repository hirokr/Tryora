import 'dotenv/config';
import logger from '#src/config/logger.ts';
import {
  close3DModelWorker,
  model3DWorker,
} from '#src/workers/3dmodel.worker.ts';
import {
  closeProductImageEditWorker,
  productImageEditWorker,
} from '#src/workers/image/Image.worker.ts';
import {
  closeTryOnImageWorker,
  tryOnImageWorker,
} from '#src/workers/tryOnImage.worker.ts';

const shutdown = async (signal: string) => {
  logger.info(`[BullMQ] Worker shutdown signal received: ${signal}`);

  try {
    await Promise.all([
      close3DModelWorker(),
      closeProductImageEditWorker(),
      closeTryOnImageWorker(),
    ]);
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

model3DWorker
  .waitUntilReady()
  .then(() => {
    logger.info('[BullMQ] 3D worker is running');
  })
  .catch(error => {
    logger.error(`[BullMQ] Worker failed to start: ${String(error)}`);
    process.exit(1);
  });

productImageEditWorker
  .waitUntilReady()
  .then(() => {
    logger.info('[BullMQ] Product image edit worker is running');
  })
  .catch(error => {
    logger.error(`[BullMQ] Worker failed to start: ${String(error)}`);
    process.exit(1);
  });

tryOnImageWorker
  .waitUntilReady()
  .then(() => {
    logger.info('[BullMQ] Try-on image worker is running');
  })
  .catch(error => {
    logger.error(`[BullMQ] Worker failed to start: ${String(error)}`);
    process.exit(1);
  });
