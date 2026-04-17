import { createCustomQueue } from './base.queue.ts';

export interface ProductImageEditJobData {
  generationJobId: string;
  sourceImageUrl: string;
  editType: 'background-removal' | 'upscale' | 'crop' | 'overlay';
  productId: string;
}

/**
 * Constant for the Job Name to ensure consistency across the app
 */
export const PRODUCT_IMAGE_EDIT_JOB_NAME = 'product-image-edit-task';
export const PRODUCT_IMAGE_EDIT_QUEUE_NAME = 'product-image-edit-queue';


// Config from Env
const options = {
  attempts: Number(process.env.IMAGE_JOB_ATTEMPTS) || 3,
  backoff: Number(process.env.IMAGE_JOB_BACKOFF_MS) || 2000,
  keep: Number(process.env.IMAGE_KEEP_COMPLETED) || 200,
};

// Create the specific queue
const imageEditManager = createCustomQueue<ProductImageEditJobData, 'edit-job'>(
  'image-edit',
  'edit-job',
  options
);

// Export only what you need
export const {
  add: enqueueProductImageEditJob,
  getState: getProductImageEditJobState,
  close: closeProductImageEditQueue,
} = imageEditManager;
