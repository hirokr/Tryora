import { createCustomQueue } from './base.queue.ts';

export type ImageQueueJobType = 'image-generation' | 'image-fusion';

export interface ImageGenerationQueueParams {
  jobType: 'image-generation';
  sourceImageUrl: string;
  userPrompt: string;
  variantId?: string;
}

export interface ImageFusionQueueParams {
  jobType: 'image-fusion';
  baseImageUrl: string;
  productImageUrls: string[];
}

export type ImageQueueParams =
  | ImageGenerationQueueParams
  | ImageFusionQueueParams;

export interface ProductImageEditJobData {
  generationJobId: string;
  productId: string;
  params: ImageQueueParams;
}

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
