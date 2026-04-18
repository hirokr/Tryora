import { JobStatus, JobType, PROVIDER } from '#src/generated/enums.ts';
import { getJobById } from '#src/services/job.service.ts';
import { getTryOnByJobId } from '#src/services/tryon.service.ts';
import { TryonJobStatusState, TryonSocketData } from '#src/types/jobs.js';

const TERMINAL_JOB_STATUSES = new Set<JobStatus>([
  JobStatus.COMPLETED,
  JobStatus.FAILED,
  JobStatus.CANCELLED,
]);

export const isTerminalJobStatus = (status: JobStatus): boolean =>
  TERMINAL_JOB_STATUSES.has(status);

export const getTryonJobStatusState = async (
  jobId: string
): Promise<TryonJobStatusState> => {
  const [job, tryonData] = await Promise.all([
    getJobById(jobId),
    getTryOnByJobId(jobId),
  ]);

  const fallbackTryonData: TryonSocketData | null =
    !tryonData &&
    job.status === JobStatus.COMPLETED &&
    Boolean(job.outputresultUrl)
      ? {
          id: null,
          userId: job.userId,
          jobId: job.id,
          resultUrl: job.outputresultUrl,
          productIds: job.productId ? [job.productId] : [],
          tryonType: job.jobType,
          provider:
            job.jobType === JobType.MODEL ? PROVIDER.PIXAZO : PROVIDER.CLAID,
          createdAt: job.completedAt ?? job.createdAt,
          isPersisted: false,
        }
      : null;

  return {
    ownerUserId: job.userId,
    payload: {
      jobId: job.id,
      status: job.status,
      jobType: job.jobType,
      outputresultUrl: job.outputresultUrl,
      tryonData: tryonData
        ? {
            id: tryonData.id,
            userId: tryonData.userId,
            jobId: tryonData.jobId,
            resultUrl: tryonData.resultUrl,
            productIds: tryonData.productIds,
            tryonType: tryonData.tryonType,
            provider: tryonData.provider,
            createdAt: tryonData.createdAt,
            isPersisted: true,
          }
        : fallbackTryonData,
    },
  };
};
