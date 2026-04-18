import { ProductImageEditJobData } from '#src/types/typesimage.js';
import { createCustomQueue } from './base.queue.ts';

export const PRODUCT_IMAGE_EDIT_JOB_NAME = 'product-image-edit-task';
export const PRODUCT_IMAGE_EDIT_QUEUE_NAME = 'product-image-edit-queue';

const options = {
  attempts: Number(process.env.IMAGE_JOB_ATTEMPTS) || 3,
  backoff: Number(process.env.IMAGE_JOB_BACKOFF_MS) || 2000,
  keep: Number(process.env.IMAGE_KEEP_COMPLETED) || 200,
};

const imageEditManager = createCustomQueue<
  ProductImageEditJobData,
  typeof PRODUCT_IMAGE_EDIT_JOB_NAME
>(PRODUCT_IMAGE_EDIT_QUEUE_NAME, PRODUCT_IMAGE_EDIT_JOB_NAME, options);

// Export only what you need
export const {
  add: enqueueProductImageJob,
  getState: getProductImageJobState,
  close: closeProductImageQueue,
} = imageEditManager;

// CSE420 -> LRK, NLAM, SUE(best),
// CSE428 -> MOM
// CSE461 -> UTKR
// CST    ->
// CSE360 -> SHBK
