import prisma from '#src/config/database.ts';
import { enqueue3DModelJob } from '#src/queues/3dmodel.queue.ts';
import type {
  Generate3DModelOptions,
  GenerationJobProgressRecord,
  GenerationJobStatusResponse,
  TryonResult3DRecord,
} from '#src/types/3d.js';
import { JobStatus, JobType } from '@prisma/client';

const MAX_RETRIES = 3;

export const findTryonResult3DRecord = async (
  userId: string,
  tryonResultId: string
): Promise<TryonResult3DRecord | null> => {
  return prisma.tryonResult.findFirst({
    where: {
      id: tryonResultId,
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      resultImageUrl: true,
      glbUrl: true,
      glbJobId: true,
    },
  });
};

export const create3DModelGenerationJob = async (
  userId: string,
  { tryonResultId, imageUri, prompt = '' }: Generate3DModelOptions
) => {
  const normalizedPrompt = prompt.trim();

  const generationJob = await prisma.generationJob.create({
    data: {
      userId,
      jobType: JobType.MODEL_3D_GENERATION,
      status: JobStatus.QUEUED,
      inputData: {
        tryonResultId,
        imageUri,
        prompt: normalizedPrompt,
      },
      maxRetries: MAX_RETRIES,
    },
  });

  try {
    await enqueue3DModelJob(
      {
        generationJobId: generationJob.id,
        userId,
        tryonResultId,
        imageUri,
        prompt: normalizedPrompt,
      },
      generationJob.maxRetries
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.generationJob.update({
      where: { id: generationJob.id },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: `Failed to enqueue BullMQ job: ${message}`,
      },
    });

    throw error;
  }

  return generationJob;
};

export const getGenerationJobStatusForUser = async (
  userId: string,
  jobId: string
): Promise<GenerationJobStatusResponse | null> => {
  const generationJob = await prisma.generationJob.findFirst({
    where: {
      id: jobId,
      userId,
    },
    select: {
      id: true,
      jobType: true,
      status: true,
      progress: true,
      currentStage: true,
      outputGlbUrl: true,
      errorMessage: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      retryCount: true,
    },
  });

  if (!generationJob) {
    return null;
  }

  let tryonResultId: string | null = null;

  if (
    generationJob.status === JobStatus.COMPLETED &&
    generationJob.jobType === JobType.MODEL_3D_GENERATION
  ) {
    const tryonResult = await prisma.tryonResult.findFirst({
      where: { glbJobId: generationJob.id },
      select: { id: true },
    });

    tryonResultId = tryonResult?.id || null;
  }

  return {
    ...generationJob,
    tryonResultId,
  };
};

export const getGenerationJobProgress = async (
  jobId: string
): Promise<GenerationJobProgressRecord | null> => {
  return prisma.generationJob.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      progress: true,
      currentStage: true,
      errorMessage: true,
    },
  });
};

export const clear3DModelByTryonResultId = async (
  tryonResultId: string,
  glbUrl: string
) => {
  await prisma.$transaction([
    prisma.tryonResult.update({
      where: { id: tryonResultId },
      data: {
        glbUrl: null,
        glbJobId: null,
      },
    }),
    prisma.generationJob.updateMany({
      where: { outputGlbUrl: glbUrl },
      data: { outputGlbUrl: null },
    }),
  ]);
};

export const mark3DJobAsProcessing = async (
  generationJobId: string,
  retryCount: number
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      status: JobStatus.PROCESSING,
      startedAt: new Date(),
      currentStage: 'submitting',
      progress: 5,
      retryCount,
      errorMessage: null,
    },
  });
};

export const set3DJobThirdPartyTask = async (
  generationJobId: string,
  thirdPartyTaskId: string
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      thirdPartyTaskId,
      currentStage: 'queued',
      progress: 10,
    },
  });
};

export const update3DJobProgress = async (
  generationJobId: string,
  progress: number,
  currentStage: string
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      progress,
      currentStage,
    },
  });
};

export const complete3DGenerationJob = async (
  generationJobId: string,
  tryonResultId: string,
  modelUrl: string,
  previewUrl: string | null
) => {
  await prisma.$transaction([
    prisma.generationJob.update({
      where: { id: generationJobId },
      data: {
        status: JobStatus.COMPLETED,
        progress: 100,
        currentStage: 'done',
        completedAt: new Date(),
        outputGlbUrl: modelUrl,
        resultData: {
          glbUrl: modelUrl,
          previewUrl,
        },
      },
    }),
    prisma.tryonResult.update({
      where: { id: tryonResultId },
      data: {
        glbUrl: modelUrl,
        glbJobId: generationJobId,
      },
    }),
  ]);
};

export const mark3DJobFailedState = async (
  generationJobId: string,
  hasRetryLeft: boolean,
  retryCount: number,
  errorMessage: string
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      status: hasRetryLeft ? JobStatus.QUEUED : JobStatus.FAILED,
      retryCount,
      errorMessage,
      completedAt: hasRetryLeft ? null : new Date(),
    },
  });
};
