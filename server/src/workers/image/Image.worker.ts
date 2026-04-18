import { Worker } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';

import { processImageJob } from './image.processor.ts';
import { ProductImageEditJobData } from '#src/types/typesimage.js';
import { PRODUCT_IMAGE_EDIT_QUEUE_NAME } from '#src/queues/Image.queue.ts';

const QUEUE_PREFIX = process.env.BULLMQ_PREFIX || 'tryora';
const CONCURRENCY = Number(process.env.IMAGE_WORKER_CONCURRENCY) || 2;

export const productImageEditWorker = new Worker<ProductImageEditJobData>(
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  processImageJob,
  {
    connection: bullmqConnection,
    prefix: QUEUE_PREFIX,
    concurrency: CONCURRENCY,
  }
);

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

export const closeProductImageEditWorker = async (): Promise<void> => {
  await productImageEditWorker.close();
};
