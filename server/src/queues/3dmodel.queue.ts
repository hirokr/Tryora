import { Queue, type JobsOptions } from 'bullmq';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  MODEL_3D_JOB_NAME,
  MODEL_3D_QUEUE_NAME,
  type Generate3DModelJobData,
} from '#src/queues/3dmodel.job.ts';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const model3DQueue = new Queue<Generate3DModelJobData>(
  MODEL_3D_QUEUE_NAME,
  {
    connection: bullmqConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }
);

export const enqueue3DModelJob = async (
  data: Generate3DModelJobData,
  maxRetries: number = DEFAULT_JOB_OPTIONS.attempts || 3
) => {
  return model3DQueue.add(MODEL_3D_JOB_NAME, data, {
    jobId: data.generationJobId,
    attempts: Math.max(1, maxRetries),
  });
};

export const close3DModelQueue = async () => {
  await model3DQueue.close();
};
