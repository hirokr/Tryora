import { Generate3DModelJobData } from '#src/types/3d.js';
import { createCustomQueue } from './base.queue.ts';

export const MODEL_GENERATION_JOB_NAME = 'model-generation-task';
export const MODEL_GENERATION_QUEUE_NAME = 'model-generation-queue';

const options = {
  attempts:
    Number(process.env.MODEL_JOB_ATTEMPTS || process.env.IMAGE_JOB_ATTEMPTS) ||
    3,
  backoff:
    Number(
      process.env.MODEL_JOB_BACKOFF_MS || process.env.IMAGE_JOB_BACKOFF_MS
    ) || 2000,
  keep:
    Number(
      process.env.MODEL_KEEP_COMPLETED || process.env.IMAGE_KEEP_COMPLETED
    ) || 200,
};

const modelGenerationManager = createCustomQueue<
  Generate3DModelJobData,
  typeof MODEL_GENERATION_JOB_NAME
>(MODEL_GENERATION_QUEUE_NAME, MODEL_GENERATION_JOB_NAME, options);

export const {
  add: enqueue3DModelJob,
  getState: get3DModelJobState,
  close: close3DModelQueue,
} = modelGenerationManager;
