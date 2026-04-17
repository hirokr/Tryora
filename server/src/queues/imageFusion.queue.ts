import { Queue, QueueEvents, type JobsOptions } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';


type QueueCleanStatus =
  | 'completed'
  | 'wait'
  | 'active'
  | 'paused'
  | 'prioritized'
  | 'delayed'
  | 'failed'
  | 'waiting';

const readPositiveInteger = (
  rawValue: string | undefined,
  fallbackValue: number
) => {
  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return Math.floor(parsedValue);
};

const queuePrefix = process.env.BULLMQ_PREFIX || 'tryora';
const defaultRetryAttempts = readPositiveInteger(
  process.env.TRYON_IMAGE_JOB_ATTEMPTS,
  3
);
const defaultBackoffDelayMs = readPositiveInteger(
  process.env.TRYON_IMAGE_JOB_BACKOFF_MS,
  2_000
);
const completedJobsToKeep = readPositiveInteger(
  process.env.TRYON_IMAGE_KEEP_COMPLETED,
  200
);
const failedJobsToKeep = readPositiveInteger(
  process.env.TRYON_IMAGE_KEEP_FAILED,
  500
);

const normalizeRetryAttempts = (maxRetries: number) => {
  if (!Number.isFinite(maxRetries) || maxRetries < 1) {
    return defaultRetryAttempts;
  }

  return Math.floor(maxRetries);
};

const createDefaultJobOptions = (maxRetries: number): JobsOptions => ({
  attempts: normalizeRetryAttempts(maxRetries),
  backoff: {
    type: 'exponential',
    delay: defaultBackoffDelayMs,
  },
  removeOnComplete: {
    count: completedJobsToKeep,
  },
  removeOnFail: {
    count: failedJobsToKeep,
  },
});

export const tryOnImageQueue = new Queue<
  TryOnImageGenerationJobData,
  unknown,
  typeof TRYON_IMAGE_JOB_NAME
>(TRYON_IMAGE_QUEUE_NAME, {
  connection: bullmqConnection,
  prefix: queuePrefix,
});

export const tryOnImageQueueEvents = new QueueEvents(TRYON_IMAGE_QUEUE_NAME, {
  connection: bullmqConnection,
  prefix: queuePrefix,export * from './tryOnImage.queue.ts';

});

tryOnImageQueueEvents.on('error', error => {
  logger.error(`[BullMQ] Try-on queue event error: ${error.message}`);
});

export const enqueueTryOnImageGenerationJob = async (
  data: TryOnImageGenerationJobData,
  maxRetries = defaultRetryAttempts
) => {
  const jobOptions = createDefaultJobOptions(maxRetries);

  return tryOnImageQueue.add(
    TRYON_IMAGE_JOB_NAME,
    data,
    {
      ...jobOptions,
      jobId: data.generationJobId,
    }
  );
};

export const getTryOnImageJob = async (jobId: string) => {
  return tryOnImageQueue.getJob(jobId);
};

export const getTryOnImageJobState = async (jobId: string) => {
  const job = await getTryOnImageJob(jobId);
  if (!job) {
    return null;
  }

  return job.getState();
};

export const getTryOnImageQueueCounts = async () => {
  return tryOnImageQueue.getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed',
    'paused'
  );
};

export const pauseTryOnImageQueue = async () => {
  await tryOnImageQueue.pause();
};

export const resumeTryOnImageQueue = async () => {
  await tryOnImageQueue.resume();
};

export const retryTryOnImageJob = async (jobId: string) => {
  const job = await getTryOnImageJob(jobId);
  if (!job) {
    return false;
  }

  await job.retry();
  return true;
};

export const removeTryOnImageJob = async (jobId: string) => {
  const job = await getTryOnImageJob(jobId);
  if (!job) {
    return false;
  }

  await job.remove();
  return true;
};

export const cleanTryOnImageQueue = async (
  graceMs = 0,
  limit = 1_000,
  type: QueueCleanStatus = 'completed'
) => {
  return tryOnImageQueue.clean(graceMs, limit, type);
};

export const waitUntilTryOnImageQueueReady = async () => {
  await tryOnImageQueue.waitUntilReady();
  await tryOnImageQueueEvents.waitUntilReady();
};

export const closeTryOnImageQueue = async () => {
  await Promise.all([tryOnImageQueueEvents.close(), tryOnImageQueue.close()]);
};
