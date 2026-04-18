import { JobStatus, JobType, PROVIDER } from '#src/generated/enums.ts';

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
