import prisma from '#src/config/database.ts';
import { JobStatus, JobType } from '#src/generated/enums.ts';
import { JobUpdateInput } from '#src/generated/models.ts';
import {
  JOB_FULL_SELECT,
  JOB_SUMMARY_SELECT,
  JobFilters,
  JobRequestType,
  JobResponseType,
} from '#src/types/Job.js';

const toJobResponse = (job: {
  id: string;
  status: JobStatus;
  outputresultUrl: string | null;
}): JobResponseType => ({
  jobId: job.id,
  status: job.status,
  outputresultUrl: job.outputresultUrl,
});

export const createJob = async (
  data: JobRequestType
): Promise<JobResponseType> => {
  const job = await prisma.job.create({
    data: {
      userId: data.userId,
      productId: data.productId,
      jobType: data.jobType ?? JobType.IMAGE_TRYON,
      thirdPartyTaskId: String(data.thirdPartyTaskId),
      outputresultUrl: data.outputresultUrl,
    },
    select: JOB_SUMMARY_SELECT,
  });

  return toJobResponse(job);
};

export const getJobById = async (jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: JOB_FULL_SELECT,
  });

  if (!job) {
    throw new Error(`Job ${jobId} was not found.`);
  }
  return job;
};

export const getJobsByUser = async (userId: string) => {
  return prisma.job.findMany({
    where: { userId },
    select: JOB_FULL_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};

export const getJobsByFilters = async (filters: JobFilters) => {
  return prisma.job.findMany({
    where: {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.jobType && { jobType: filters.jobType }),
      ...(filters.status && { status: filters.status }),
    },
    select: JOB_FULL_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};

export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true },
  });

  if (!job) {
    throw new Error(`Job ${jobId} was not found.`);
  }

  return job.status;
};

export const updateJob = async (
  jobId: string,
  data: JobUpdateInput
): Promise<JobResponseType> => {
  const job = await prisma.job.update({
    where: { id: jobId },
    data,
    select: JOB_SUMMARY_SELECT,
  });

  return toJobResponse(job);
};

export const updateJobStatus = async (
  jobId: string,
  status: JobStatus
): Promise<JobResponseType> => {
  const timestamps: Pick<JobUpdateInput, 'startedAt' | 'completedAt'> = {
    ...(status === JobStatus.PROCESSING && { startedAt: new Date() }),
    ...(status === JobStatus.COMPLETED && { completedAt: new Date() }),
    ...(status === JobStatus.FAILED && { completedAt: new Date() }),
  };

  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status, ...timestamps },
    select: JOB_SUMMARY_SELECT,
  });

  return toJobResponse(job);
};

export const updateJobResult = async (
  jobId: string,
  outputresultUrl: string,
  tryonId?: string
): Promise<JobResponseType> => {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      outputresultUrl,
      ...(tryonId && { tryonId }),
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
    },
    select: JOB_SUMMARY_SELECT,
  });

  return toJobResponse(job);
};

export const deleteJob = async (jobId: string): Promise<void> => {
  await prisma.job.delete({
    where: { id: jobId },
  });
};

export const deleteJobsByUser = async (userId: string): Promise<number> => {
  const { count } = await prisma.job.deleteMany({
    where: { userId },
  });

  return count;
};
