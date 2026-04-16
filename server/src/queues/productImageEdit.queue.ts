import { Queue, type JobsOptions } from 'bullmq';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  PRODUCT_IMAGE_EDIT_JOB_NAME,
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  type ProductImageEditJobData,
} from '#src/queues/productImageEdit.job.ts';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const productImageEditQueue = new Queue<ProductImageEditJobData>(
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  {
    connection: bullmqConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }
);

export const enqueueProductImageEditJob = async (
  data: ProductImageEditJobData,
  maxRetries: number = DEFAULT_JOB_OPTIONS.attempts || 3
) => {
  return productImageEditQueue.add(PRODUCT_IMAGE_EDIT_JOB_NAME, data, {
    jobId: data.generationJobId,
    attempts: Math.max(1, maxRetries),
  });
};

export const closeProductImageEditQueue = async () => {
  await productImageEditQueue.close();
};
