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

export const JOB_SUMMARY_SELECT = {
  id: true,
  status: true,
  jobType: true,
  outputresultUrl: true,
  createdAt: true,
} as const;

export const JOB_FULL_SELECT = {
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

export interface TryonSocketData {
  id: string | null;
  userId: string;
  jobId: string;
  resultUrl: string | null;
  productIds: string[];
  tryonType: JobType;
  provider: PROVIDER | null;
  createdAt: Date;
  isPersisted: boolean;
}

export interface TryonJobStatusPayload {
  jobId: string;
  status: JobStatus;
  jobType: JobType;
  outputresultUrl: string | null;
  tryonData: TryonSocketData | null;
}

export interface TryonJobStatusState {
  ownerUserId: string;
  payload: TryonJobStatusPayload;
}
