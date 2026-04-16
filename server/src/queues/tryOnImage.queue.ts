import { Queue, type JobsOptions } from 'bullmq';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  TRYON_IMAGE_JOB_NAME,
  TRYON_IMAGE_QUEUE_NAME,
  type TryOnImageGenerationJobData,
} from '#src/queues/tryOnImage.job.ts';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const tryOnImageQueue = new Queue<TryOnImageGenerationJobData>(
  TRYON_IMAGE_QUEUE_NAME,
  {
    connection: bullmqConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }
);

export const enqueueTryOnImageGenerationJob = async (
  data: TryOnImageGenerationJobData,
  maxRetries: number = DEFAULT_JOB_OPTIONS.attempts || 3
) => {
  return tryOnImageQueue.add(TRYON_IMAGE_JOB_NAME, data, {
    jobId: data.generationJobId,
    attempts: Math.max(1, maxRetries),
  });
};

export const closeTryOnImageQueue = async () => {
  await tryOnImageQueue.close();
};
