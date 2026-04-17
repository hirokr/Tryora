import type { Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { pollClaidUntilComplete } from './claid.poller.ts';

import { handleUrlUpload } from '#src/utils/uploadthings.ts';
import {
  getJobById,
  updateJob,
  updateJobStatus,
} from '#src/services/job.service.ts';
import { JobStatus } from '#src/generated/browser.ts';
import { ProductImageEditJobData } from '#src/types/image.js';

export const processImageJob = async (
  queueJob: Job<ProductImageEditJobData>
): Promise<void> => {
  const { generationJobId, jobType } = queueJob.data;

  try {
    const { id: jobId, thirdPartyTaskId } = await getJobById(generationJobId);

    await updateJobStatus(jobId, JobStatus.PROCESSING);

    logger.info('[ImageWorker] Polling Claid for result', {
      generationJobId,
      thirdPartyTaskId,
      pollIntervalMs: 10_000,
    });

    const claidResultUrl = await pollClaidUntilComplete(
      jobType,
      thirdPartyTaskId as string,
      generationJobId
    );

    const response = await handleUrlUpload(
      claidResultUrl,
      `tryon-${generationJobId}.png`
    );
    if (!response[0].data) {
      throw new Error(
        `Failed to upload Claid result for job ${generationJobId}.`
      );
    }

    logger.info('[ImageWorker] Claid task completed, updating job result', {
      generationJobId,
      claidResultUrl,
      uploadedUrl: response[0]?.data.ufsUrl,
    });

    const updateJobData = {
      outputresultUrl: response[0].data.ufsUrl,
      status: JobStatus.COMPLETED,
    };

    await updateJob(generationJobId, updateJobData);

    logger.info('[ImageWorker] Image generation completed', {
      generationJobId,
    });
  } catch (error) {
    await updateJob(generationJobId, { status: JobStatus.FAILED });

    logger.error('[ImageWorker] Failed to process image job', {
      generationJobId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
};
