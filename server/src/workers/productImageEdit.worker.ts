import { Worker, type Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  type ProductImageEditJobData,
} from '#src/queues/productImageEdit.job.ts';
import {
  markProductImageEditJobAsProcessing,
  markProductImageEditJobFailedState,
  processQueuedProductImageEditJob,
  updateProductImageEditJobProgress,
} from '#src/services/productImageEdit.service.ts';

const processProductImageEditJob = async (
  job: Job<ProductImageEditJobData>
) => {
  const { generationJobId } = job.data;

  await markProductImageEditJobAsProcessing(generationJobId, job.attemptsMade);
  await updateProductImageEditJobProgress(
    generationJobId,
    20,
    'calling_gemini'
  );

  const result = await processQueuedProductImageEditJob(job.data);

  return {
    generationJobId,
    imageUrl: result.defaultImageUrl,
  };
};

export const productImageEditWorker = new Worker<ProductImageEditJobData>(
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  processProductImageEditJob,
  {
    connection: bullmqConnection,
    concurrency: Number(process.env.PRODUCT_EDIT_WORKER_CONCURRENCY || 2),
  }
);

productImageEditWorker.on('ready', () => {
  logger.info('[BullMQ] Product image edit worker is ready');
});

productImageEditWorker.on('completed', job => {
  logger.info(`[BullMQ] Completed product image edit job ${job.id}`);
});

productImageEditWorker.on('failed', async (job, error) => {
  if (!job) {
    logger.error(
      `[BullMQ] Product image edit worker failure without job context: ${error.message}`
    );
    return;
  }

  const attemptsConfigured = job.opts.attempts || 1;
  const hasRetryLeft = job.attemptsMade < attemptsConfigured;

  try {
    await markProductImageEditJobFailedState(
      job.data.generationJobId,
      hasRetryLeft,
      job.attemptsMade,
      error.message
    );
  } catch (updateError) {
    logger.error(
      `[BullMQ] Failed to persist failed state for product image edit job ${job.id}: ${String(updateError)}`
    );
  }

  logger.error(
    `[BullMQ] Failed product image edit job ${job.id} (attempt ${job.attemptsMade}/${attemptsConfigured}): ${error.message}`
  );
});

export const closeProductImageEditWorker = async () => {
  await productImageEditWorker.close();
};
