import { JobStatus, JobType } from '#src/generated/enums.ts';

export interface JobRequestType {
  userId: string;
  productId: string;
  thirdPartyTaskId: string;
  outputresultUrl: string;
  jobType?: JobType;
  userPrompt?: string;
}

export interface JobResponseType {
  jobId: string;
  status: JobStatus;
  outputresultUrl: string;
}
