import { Worker, type Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  TRYON_IMAGE_QUEUE_NAME,
  type TryOnImageGenerationJobData,
} from '#src/queues/tryOnImage.job.ts';
import {
  markTryOnGenerationJobAsProcessing,
  markTryOnGenerationJobFailedState,
  processQueuedTryOnImageGenerationJob,
} from '#src/services/image.service.ts';

const processTryOnImageJob = async (job: Job<TryOnImageGenerationJobData>) => {
  const { generationJobId } = job.data;

  await markTryOnGenerationJobAsProcessing(generationJobId, job.attemptsMade);

  const result = await processQueuedTryOnImageGenerationJob(job.data);
  const firstImage = result.images[0];

  return {
    generationJobId,
    tryonResultId: firstImage?.tryonResultId || null,
    imageUrl: firstImage?.imageUrl || null,
  };
};

export const tryOnImageWorker = new Worker<TryOnImageGenerationJobData>(
  TRYON_IMAGE_QUEUE_NAME,
  processTryOnImageJob,
  {
    connection: bullmqConnection,
    concurrency: Number(process.env.TRYON_WORKER_CONCURRENCY || 2),
  }
);


tryOnImageWorker.on('ready', () => {
  logger.info('[BullMQ] Try-on image worker is ready');
});

tryOnImageWorker.on('completed', job => {
  logger.info(`[BullMQ] Completed try-on image job ${job.id}`);
});

tryOnImageWorker.on('failed', async (job, error) => {
  if (!job) {
    logger.error(
      `[BullMQ] Try-on image worker failure without job context: ${error.message}`
    );
    return;
  }

  const attemptsConfigured = job.opts.attempts || 1;
  const hasRetryLeft = job.attemptsMade < attemptsConfigured;

  try {
    await markTryOnGenerationJobFailedState(
      job.data.generationJobId,
      hasRetryLeft,
      job.attemptsMade,
      error.message
    );
  } catch (updateError) {
    logger.error(
      `[BullMQ] Failed to persist failed state for try-on image job ${job.id}: ${String(updateError)}`
    );
  }

  logger.error(
    `[BullMQ] Failed try-on image job ${job.id} (attempt ${job.attemptsMade}/${attemptsConfigured}): ${error.message}`
  );
});

export const closeTryOnImageWorker = async () => {
  await tryOnImageWorker.close();
};
