import fetch from 'node-fetch';
import { Worker, type Job } from 'bullmq';
import prisma from '#src/config/database.ts';
import logger from '#src/config/logger.ts';
import { JobStatus, JobType } from '#src/generated/enums.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  type ProductImageEditJobData,
} from '#src/queues/Image.queue.ts';
import { handleUrlUpload } from '#src/utils/uploadthings.ts';

const CLAID_API_BASE_URL = 'https://api.claid.ai';
const CLAID_POLL_INTERVAL_MS = 10_000;
const CLAID_MAX_POLL_ATTEMPTS =
  Number(process.env.CLAID_MAX_POLL_ATTEMPTS) || 60;
const CLAID_API_KEY = process.env.CLAID_API_KEY;
const QUEUE_PREFIX = process.env.BULLMQ_PREFIX || 'tryora';

type ClaidPollResponse = {
  status?: string;
  result_url?: string;
  errors?: Array<{ error?: string; message?: string }>;
  data?: {
    status?: string;
    result_url?: string;
    errors?: Array<{ error?: string; message?: string }>;
    result?: {
      output_objects?: Array<{ tmp_url?: string; object_uri?: string }>;
    };
    output?: {
      images?: Array<{ url?: string }>;
    };
  };
  result?: {
    output_objects?: Array<{ tmp_url?: string; object_uri?: string }>;
  };
  output?: {
    images?: Array<{ url?: string }>;
  };
};

const sleep = async (delayMs: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, delayMs));
};

const normalizePollingUrl = (url: string): string => {
  if (url.startsWith('http://api.claid.ai/')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

const getClaidStatusUrl = (
  jobType: ProductImageEditJobData['params']['jobType'],
  processingRequestId: string
): string => {
  const endpointPath =
    jobType === 'image-fusion' ? 'ai-fashion-models' : 'ai-edit';

  return normalizePollingUrl(
    `${CLAID_API_BASE_URL}/v1/image/${endpointPath}/${encodeURIComponent(
      processingRequestId
    )}`
  );
};

const readStatus = (payload: ClaidPollResponse): string => {
  return (
    payload.data?.status?.toUpperCase() || payload.status?.toUpperCase() || ''
  );
};

const readErrors = (payload: ClaidPollResponse): string[] => {
  const list = payload.data?.errors || payload.errors || [];

  return list
    .map(item => item.error || item.message || '')
    .filter(message => Boolean(message));
};

const readResultUrl = (payload: ClaidPollResponse): string | null => {
  return (
    payload.data?.result_url ||
    payload.result_url ||
    payload.data?.result?.output_objects?.[0]?.tmp_url ||
    payload.data?.result?.output_objects?.[0]?.object_uri ||
    payload.result?.output_objects?.[0]?.tmp_url ||
    payload.result?.output_objects?.[0]?.object_uri ||
    payload.data?.output?.images?.[0]?.url ||
    payload.output?.images?.[0]?.url ||
    null
  );
};

const pollUntilCompleted = async (
  statusUrl: string,
  generationJobId: string
): Promise<string> => {
  if (!CLAID_API_KEY) {
    throw new Error('CLAID_API_KEY is not configured.');
  }

  let attempt = 0;

  while (attempt < CLAID_MAX_POLL_ATTEMPTS) {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CLAID_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Claid polling failed for ${generationJobId} (status ${response.status}): ${errorText}`
      );
    }

    const payload = (await response.json()) as ClaidPollResponse;
    const status = readStatus(payload);
    const resultUrl = readResultUrl(payload);

    if (resultUrl && (status === 'DONE' || status === 'COMPLETED' || !status)) {
      return normalizePollingUrl(resultUrl);
    }

    if (status === 'DONE' || status === 'COMPLETED') {
      throw new Error(
        `Claid returned ${status} for ${generationJobId} without a result URL.`
      );
    }

    if (
      status === 'ERROR' ||
      status === 'FAILED' ||
      status === 'CANCELLED' ||
      status === 'PAUSED'
    ) {
      const joinedErrors = readErrors(payload).join('; ');
      throw new Error(
        joinedErrors
          ? `Claid request failed with status ${status}: ${joinedErrors}`
          : `Claid request failed with status ${status}`
      );
    }

    attempt += 1;
    await sleep(CLAID_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Claid polling timed out after ${CLAID_MAX_POLL_ATTEMPTS} attempts for ${generationJobId}.`
  );
};

const readUploadThingResult = (
  uploadResult: Awaited<ReturnType<typeof handleUrlUpload>>
): { uploadedUrl: string; uploadKey: string | null } => {
  const firstResult = Array.isArray(uploadResult)
    ? uploadResult[0]
    : uploadResult;

  if (!firstResult || typeof firstResult !== 'object') {
    throw new Error('UploadThing did not return a valid response.');
  }

  const firstResultRecord = firstResult as unknown as {
    error?: { message?: string };
    data?: {
      ufsUrl?: string;
      url?: string;
      appUrl?: string;
      key?: string;
    } | null;
    ufsUrl?: string;
    url?: string;
    appUrl?: string;
    key?: string;
  };

  const uploadData =
    firstResultRecord.data && typeof firstResultRecord.data === 'object'
      ? firstResultRecord.data
      : undefined;

  if (firstResultRecord.error?.message) {
    throw new Error(`UploadThing error: ${firstResultRecord.error.message}`);
  }

  const uploadedUrl =
    uploadData?.ufsUrl ||
    uploadData?.url ||
    uploadData?.appUrl ||
    firstResultRecord.ufsUrl ||
    firstResultRecord.url ||
    firstResultRecord.appUrl;

  if (!uploadedUrl) {
    throw new Error('UploadThing upload succeeded but no URL was returned.');
  }

  const uploadKey = uploadData?.key || firstResultRecord.key || null;

  return { uploadedUrl, uploadKey };
};

const persistCompletedImageJob = async (
  queueJobData: ProductImageEditJobData,
  outputImageUrl: string
): Promise<void> => {
  const generationJob = await prisma.job.findUnique({
    where: {
      id: queueJobData.generationJobId,
    },
    select: {
      id: true,
      userId: true,
      jobType: true,
    },
  });

  if (!generationJob) {
    throw new Error(
      `generation_job ${queueJobData.generationJobId} was not found.`
    );
  }

  let tryonId: string | null = null;

  if (generationJob.jobType === JobType.IMAGE_TRYON) {
    const userImageId =
      queueJobData.params.jobType === 'image-fusion'
        ? queueJobData.params.bodyImageId || generationJob.userId
        : generationJob.userId;

    const tryon = await prisma.tryon.create({
      // Keep this as a cast because the generated Prisma types in this repo are inconsistent.
      data: {
        userId: generationJob.userId,
        userImageId,
        productId: [queueJobData.productId],
        jobId: generationJob.id,
        resultUrl: outputImageUrl,
        tryonType: JobType.IMAGE_TRYON,
        provider: 'claid',
      } as any,
      select: {
        id: true,
      },
    });

    tryonId = tryon.id;
  }

  await prisma.job.update({
    where: {
      id: generationJob.id,
    },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      outputresultUrl: outputImageUrl,
      tryonId,
    },
  });
};

const markJobAsFailed = async (
  generationJobId: string,
  reason: unknown
): Promise<void> => {
  try {
    await prisma.job.update({
      where: {
        id: generationJobId,
      },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('[ImageWorker] Failed to mark generation job as FAILED', {
      generationJobId,
      reason: reason instanceof Error ? reason.message : String(reason),
      updateError: error instanceof Error ? error.message : String(error),
    });
  }
};

const handleProductImageEditJob = async (
  queueJob: Job<ProductImageEditJobData>
): Promise<void> => {
  const { generationJobId } = queueJob.data;

  try {
    const generationJob = await prisma.job.findUnique({
      where: {
        id: generationJobId,
      },
      select: {
        id: true,
        thirdPartyTaskId: true,
      },
    });

    if (!generationJob) {
      throw new Error(`generation_job ${generationJobId} was not found.`);
    }

    if (!generationJob.thirdPartyTaskId) {
      throw new Error(
        `generation_job ${generationJobId} does not contain thirdPartyTaskId.`
      );
    }

    await prisma.job.update({
      where: {
        id: generationJob.id,
      },
      data: {
        status: JobStatus.PROCESSING,
        startedAt: new Date(),
      },
    });

    const statusUrl = getClaidStatusUrl(
      queueJob.data.params.jobType,
      generationJob.thirdPartyTaskId
    );

    logger.info('[ImageWorker] Polling Claid status endpoint', {
      generationJobId,
      statusUrl,
      pollIntervalMs: CLAID_POLL_INTERVAL_MS,
    });

    const generatedSourceUrl = await pollUntilCompleted(
      statusUrl,
      generationJobId
    );

    const uploadResult = await handleUrlUpload(
      generatedSourceUrl,
      `tryon-${generationJobId}.png`
    );
    const { uploadedUrl, uploadKey } = readUploadThingResult(uploadResult);

    await persistCompletedImageJob(queueJob.data, uploadedUrl);

    logger.info('[ImageWorker] Image generation completed', {
      generationJobId,
      uploadedUrl,
      uploadKey,
    });
  } catch (error) {
    await markJobAsFailed(generationJobId, error);

    logger.error('[ImageWorker] Failed to process image job', {
      generationJobId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
};

export const productImageEditWorker = new Worker<ProductImageEditJobData>(
  PRODUCT_IMAGE_EDIT_QUEUE_NAME,
  handleProductImageEditJob,
  {
    connection: bullmqConnection,
    prefix: QUEUE_PREFIX,
    concurrency: Number(process.env.IMAGE_WORKER_CONCURRENCY) || 2,
  }
);

productImageEditWorker.on('completed', completedJob => {
  logger.info('[ImageWorker] Queue job completed', {
    queueJobId: completedJob.id,
    generationJobId: completedJob.data.generationJobId,
  });
});

productImageEditWorker.on('failed', (failedJob, error) => {
  logger.error('[ImageWorker] Queue job failed', {
    queueJobId: failedJob?.id,
    generationJobId: failedJob?.data?.generationJobId,
    error: error.message,
  });
});

export const closeProductImageEditWorker = async (): Promise<void> => {
  await productImageEditWorker.close();
};
