import { Worker, type Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import { PRODUCT_IMAGE_EDIT_QUEUE_NAME } from '#src/queues/ImageEdit.queue.ts';
// import {
//   PRODUCT_IMAGE_EDIT_QUEUE_NAME,
//   type ProductImageEditJobData,
// } from './types.ts';

ProductImageEditJobData

/**
 * Worker for handling 20s+ image editing tasks.
 */
export const productImageEditWorker = new Worker<ProductImageEditJobData>(
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  async (job: Job<ProductImageEditJobData>) => {
    const { generationJobId, editType, sourceImageUrl, productId } = job.data;

    logger.info(
      `[Worker] Starting job ${job.id} for Product ${productId} (Type: ${editType})`
    );

    try {
      await job.updateProgress(10);

      await performHeavyImageWork(job);

      await job.updateProgress(100);

      return {
        processedImageUrl: `https://example.com{generationJobId}.webp`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`[Worker] Failed job ${job.id}: ${error?.message }`);
      throw error; 
    }
  },
  {
    connection: bullmqConnection,

    concurrency: 5,
    lockDuration: 30000, // 30 seconds
  }
);

/**
 * Mock function representing your 20s+ logic
 */
async function performHeavyImageWork(job: Job) {
  // Replace this with your actual image processing logic
  return new Promise(resolve => setTimeout(resolve, 20000));
}

// Error Listeners
productImageEditWorker.on('completed', job => {
  logger.info(`[Worker] Job ${job.id} has completed!`);
});

productImageEditWorker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
});
