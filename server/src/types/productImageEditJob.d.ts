import type { JobStatus } from '@prisma/client';
import type { ProductAppearanceEditInput } from '#src/types/productImageEdit.js';

export interface ProductImageEditJobData {
  generationJobId: string;
  userId: string;
  productId: string;
  input: ProductAppearanceEditInput;
}

export interface ProductImageEditQueueResponse {
  jobId: string;
  status: JobStatus;
}
