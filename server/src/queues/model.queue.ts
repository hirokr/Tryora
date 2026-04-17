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
  process.env.MODEL_3D_JOB_ATTEMPTS,
  3
);
const defaultBackoffDelayMs = readPositiveInteger(
  process.env.MODEL_3D_JOB_BACKOFF_MS,
  3_000
);
const completedJobsToKeep = readPositiveInteger(
  process.env.MODEL_3D_KEEP_COMPLETED,
  200
);
const failedJobsToKeep = readPositiveInteger(
  process.env.MODEL_3D_KEEP_FAILED,
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

export const model3DQueue = new Queue<
  Generate3DModelJobData,
  unknown,
  typeof MODEL_3D_JOB_NAME
>(MODEL_3D_QUEUE_NAME, {
  connection: bullmqConnection,
  prefix: queuePrefix,
});

export const model3DQueueEvents = new QueueEvents(MODEL_3D_QUEUE_NAME, {
  connection: bullmqConnection,
  prefix: queuePrefix,
});

model3DQueueEvents.on('error', error => {
  logger.error(`[BullMQ] 3D queue event error: ${error.message}`);
});

export const enqueue3DModelJob = async (
  data: Generate3DModelJobData,
  maxRetries = defaultRetryAttempts
) => {
  const jobOptions = createDefaultJobOptions(maxRetries);

  return model3DQueue.add(MODEL_3D_JOB_NAME, data, {
    ...jobOptions,
    jobId: data.generationJobId,
  });
};

export const get3DModelJob = async (jobId: string) => {
  return model3DQueue.getJob(jobId);
};

export const get3DModelJobState = async (jobId: string) => {
  const job = await get3DModelJob(jobId);
  if (!job) {
    return null;
  }

  return job.getState();
};

export const get3DModelQueueCounts = async () => {
  return model3DQueue.getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed',
    'paused'
  );
};

export const pause3DModelQueue = async () => {
  await model3DQueue.pause();
};

export const resume3DModelQueue = async () => {
  await model3DQueue.resume();
};

export const retry3DModelJob = async (jobId: string) => {
  const job = await get3DModelJob(jobId);
  if (!job) {
    return false;
  }

  await job.retry();
  return true;
};

export const remove3DModelJob = async (jobId: string) => {
  const job = await get3DModelJob(jobId);
  if (!job) {
    return false;
  }

  await job.remove();
  return true;
};

export const clean3DModelQueue = async (
  graceMs = 0,
  limit = 1_000,
  type: QueueCleanStatus = 'completed'
) => {
  return model3DQueue.clean(graceMs, limit, type);
};

export const waitUntil3DModelQueueReady = async () => {
  await model3DQueue.waitUntilReady();
  await model3DQueueEvents.waitUntilReady();
};

export const close3DModelQueue = async () => {
  await Promise.all([model3DQueueEvents.close(), model3DQueue.close()]);
};
