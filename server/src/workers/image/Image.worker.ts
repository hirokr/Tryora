import { Worker } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  type ProductImageEditJobData,
} from '#src/queues/Image.queue.ts';
import { processImageJob } from './image.processor.ts';

const QUEUE_PREFIX = process.env.BULLMQ_PREFIX || 'tryora';
const CONCURRENCY = Number(process.env.IMAGE_WORKER_CONCURRENCY) || 2;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const productImageEditWorker = new Worker<ProductImageEditJobData>(
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  processImageJob,
  {
    connection: bullmqConnection,
    prefix: QUEUE_PREFIX,
    concurrency: CONCURRENCY,
  }
);

// ─── Events ───────────────────────────────────────────────────────────────────

productImageEditWorker.on('completed', job => {
  logger.info('[ImageWorker] Queue job completed', {
    queueJobId: job.id,
    generationJobId: job.data.generationJobId,
  });
});

productImageEditWorker.on('failed', (job, error) => {
  logger.error('[ImageWorker] Queue job failed', {
    queueJobId: job?.id,
    generationJobId: job?.data?.generationJobId,
    error: error.message,
  });
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export const closeProductImageEditWorker = async (): Promise<void> => {
  await productImageEditWorker.close();
};
