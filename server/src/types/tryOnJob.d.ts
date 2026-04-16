import type { JobStatus } from '@prisma/client';

export type TryOnCategory = 'tops' | 'bottoms' | 'full_body';
export type Poser = 'front' | 'side' | 'back';

export interface TryOnImageGenerationJobData {
  generationJobId: string;
  userId: string;
  bodyImageId: string;
  productIds: string[];
  poser: Poser;
  category: TryOnCategory;
}

export interface TryOnImageGenerationQueueResponse {
  jobId: string;
  status: JobStatus;
}
