import prisma from '#src/config/database.ts';
import { JobType, PROVIDER } from '#src/generated/enums.ts';
import type { JobUpdateInput } from '#src/services/job.service.ts';
import { TryOnUpdateDataType } from '#src/types/tryon.js';

type JobTryonRecord = {
  id: string;
  userId: string;
  jobId: string;
  resultUrl: string | null;
  productIds: string[];
  tryonType: JobType;
  provider: PROVIDER | null;
  createdAt: Date;
};

type JobRowForTryon = {
  id: string;
  userId: string;
  productId: string | null;
  jobType: JobType;
  thirdPartyTaskId: string | null;
  outputresultUrl: string | null;
  createdAt: Date;
};

function mapJobToTryonRecord(job: JobRowForTryon): JobTryonRecord {
  return {
    id: job.id,
    userId: job.userId,
    jobId: job.id,
    resultUrl: job.outputresultUrl,
    productIds: job.productId ? [job.productId] : [],
    tryonType: job.jobType,
    provider: job.jobType === JobType.MODEL ? PROVIDER.PIXAZO : PROVIDER.CLAID,
    createdAt: job.createdAt,
  };
}

export async function getTryOnImage(id: string) {
  const tryonImage = await prisma.job.findUnique({
    where: { id },
    select: {
      outputresultUrl: true,
    },
  });
  return tryonImage?.outputresultUrl;
}

export async function createTryOn(
  userId: string,
  productIds: string[],
  jobId: string,
  tryonType: JobType,
  provider: PROVIDER,
  resultUrl: string
) {
  return await prisma.job.create({
    data: {
      userId,
      productId: productIds[0],
      jobType: tryonType,
      thirdPartyTaskId: jobId,
      outputresultUrl: resultUrl,
    },
  });
}

export async function updateTryOnResult(id: string, data: TryOnUpdateDataType) {
  const updateData: JobUpdateInput = {
    ...(data.jobId ? { thirdPartyTaskId: data.jobId } : {}),
    ...(data.resultUrl !== undefined
      ? { outputresultUrl: data.resultUrl }
      : {}),
  };

  if (data.tryonType) {
    updateData.tryonId = data.provider ? id : data.tryonType;
  }

  return await prisma.job.update({
    where: { id },
    data: updateData,
  });
}

export async function getTryon(limit: number, skip: number) {
  const jobs = await prisma.job.findMany({
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      productId: true,
      jobType: true,
      thirdPartyTaskId: true,
      outputresultUrl: true,
      createdAt: true,
    },
  });
  console.log('Fetched try-on jobs:', jobs);
  return jobs.map((job) => mapJobToTryonRecord(job));
}

export async function getTryOnById(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      productId: true,
      jobType: true,
      thirdPartyTaskId: true,
      outputresultUrl: true,
      createdAt: true,
    },
  });
  console.log(`Fetched try-on job for id ${id}:`, job);

  return job ? mapJobToTryonRecord(job) : null;
}

export async function getTryOnByJobId(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      userId: true,
      productId: true,
      jobType: true,
      thirdPartyTaskId: true,
      outputresultUrl: true,
      createdAt: true,
    },
  });

  return job ? mapJobToTryonRecord(job) : null;
}

export async function getTryOnsByUserId(userId: string) {
  console.log(userId);
  
  const jobs = await prisma.job.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      productId: true,
      jobType: true,
      thirdPartyTaskId: true,
      outputresultUrl: true,
      createdAt: true,
    },
  });
  console.log(`Fetched try-on jobs for user ${userId}:`, jobs);
  return jobs.map((job) => mapJobToTryonRecord(job));
}

export async function deleteTryOn(id: string) {
  return await prisma.job.delete({
    where: { id },
  });
}
