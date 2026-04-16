import type { JobStatus, JobType } from '@prisma/client';

export interface Generate3DModelOptions {
  tryonResultId: string;
  imageUri: string;
  prompt?: string;
}

export interface Generate3DModelJobData {
  generationJobId: string;
  userId: string;
  tryonResultId: string;
  imageUri: string;
  prompt: string;
}

export interface TryonResult3DRecord {
  id: string;
  resultImageUrl: string;
  glbUrl: string | null;
  glbJobId: string | null;
}

export interface GenerationJobStatusRecord {
  id: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  currentStage: string | null;
  outputGlbUrl: string | null;
  outputImageUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  retryCount: number;
}

export interface GenerationJobStatusResponse extends GenerationJobStatusRecord {
  tryonResultId: string | null;
  productId: string | null;
}

export interface GenerationJobProgressRecord {
  status: JobStatus;
  progress: number;
  currentStage: string | null;
  errorMessage: string | null;
}

export interface HunyuanStartRequestPayload {
  input_image_url: string;
  prompt: string;
  face_count: number;
}

export type HunyuanStartResponse = {
  id: string; // job id
};

export type HunyuanStatusResponse = {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  output?: {
    model_url?: string;
    preview_url?: string;
  };
  error?: string;
};
