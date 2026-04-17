import { Worker } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import { MODEL_GENERATION_QUEUE_NAME } from '#src/queues/model.queue.ts';
import type { Generate3DModelJobData } from '#src/types/3d.js';
import { process3DModelJob } from './3dmodel.processor.ts';

const QUEUE_PREFIX = process.env.BULLMQ_PREFIX || 'tryora';
const CONCURRENCY = Number(process.env.MODEL_WORKER_CONCURRENCY) || 2;

export const modelGenerationWorker = new Worker<Generate3DModelJobData>(
  MODEL_GENERATION_QUEUE_NAME,
  process3DModelJob,
  {
    connection: bullmqConnection,
    prefix: QUEUE_PREFIX,
    concurrency: CONCURRENCY,
  }
);

modelGenerationWorker.on('completed', job => {
  logger.info('[ModelWorker] Queue job completed', {
    queueJobId: job.id,
    generationJobId: job.data.generationJobId,
  });
});

modelGenerationWorker.on('failed', (job, error) => {
  logger.error('[ModelWorker] Queue job failed', {
    queueJobId: job?.id,
    generationJobId: job?.data?.generationJobId,
    error: error.message,
  });
});

export const closeModelGenerationWorker = async (): Promise<void> => {
  await modelGenerationWorker.close();
};
