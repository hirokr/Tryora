import { JobStatus, JobType } from '#src/generated/enums.ts';

export interface JobRequestType {
  userId: string;
  productId?: string;
  variantId?: string;
  thirdPartyTaskId: string;
  outputresultUrl: string;
  jobType?: JobType;
  userPrompt?: string;
}

export interface JobResponseType {
  jobId: string;
  status: JobStatus;
  outputresultUrl: string | null;
}

export type JobFilters = {
  userId?: string;
  productId?: string;
  jobType?: JobType;
  status?: JobStatus;
};

export type JobUpdateInput = Partial<{
  status: JobStatus;
  thirdPartyTaskId: string;
  outputresultUrl: string | null;
  tryonId: string;
  startedAt: Date;
  completedAt: Date;
}>;

const JOB_SUMMARY_SELECT = {
  id: true,
  status: true,
  jobType: true,
  outputresultUrl: true,
  createdAt: true,
} as const;

const JOB_FULL_SELECT = {
  id: true,
  userId: true,
  productId: true,
  jobType: true,
  status: true,
  thirdPartyTaskId: true,
  outputresultUrl: true,
  tryonId: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
} as const;
