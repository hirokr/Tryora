import prisma from '#src/config/database.ts';
import { JobType, PROVIDER } from '#src/generated/enums.ts';
import { TryOnUpdateDataType } from '#src/types/tryon.js';

export async function getTryOnImage(id: string) {
  const tryonImage = await prisma.tryon.findUnique({
    where: { id },
    select: {
      resultUrl: true,
    },
  });
  return tryonImage?.resultUrl;
}

export async function createTryOnJob(
  userId: string,
  productIds: string[],
  jobId: string,
  tryonType: JobType,
  provider: PROVIDER,
  resultUrl: string
) {
  return await prisma.tryon.create({
    data: {
      userId,
      resultUrl,
      productIds,
      jobId,
      tryonType,
      provider,
    },
  });
}

export async function updateTryOnJobResult(
  id: string,
  data: TryOnUpdateDataType
) {
  return await prisma.tryon.update({
    where: { id },
    data,
  });
}

export async function getTryOnJobById(jobId: string) {
  return await prisma.tryon.findUnique({
    where: { jobId },
  });
}

export async function getTryOnJobsByUserId(userId: string) {
  return await prisma.tryon.findMany({
    where: { userId },
  });
}

export async function deleteTryOnJob(jobId: string) {
  return await prisma.tryon.delete({
    where: { jobId },
  });
}
