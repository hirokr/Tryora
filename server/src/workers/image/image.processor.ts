import type { Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { pollClaidUntilComplete } from './claid.poller.ts';

import { handleUrlUpload } from '#src/utils/uploadthings.ts';
import {
  getJobById,
  updateJobResult,
  updateJobStatus,
} from '#src/services/job.service.ts';
import { JobStatus } from '#src/generated/browser.ts';
import { ProductImageEditJobData } from '#src/types/image.js';

export const processImageJob = async (
  queueJob: Job<ProductImageEditJobData>
): Promise<void> => {
  const { generationJobId } = queueJob.data;

  try {
    const { id: jobId, thirdPartyTaskId, jobType } =
      await getJobById(generationJobId);

    if (!thirdPartyTaskId) {
      throw new Error(`Missing third-party task ID for job ${generationJobId}.`);
    }

    await updateJobStatus(jobId, JobStatus.PROCESSING);

    logger.info('[ImageWorker] Polling Claid for result', {
      generationJobId,
      thirdPartyTaskId,
      pollIntervalMs: 10_000,
    });

    const claidResultUrl = await pollClaidUntilComplete(
      jobType,
      thirdPartyTaskId,
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

    await updateJobResult(generationJobId, response[0].data.ufsUrl);

    logger.info('[ImageWorker] Image generation completed', {
      generationJobId,
    });
  } catch (error) {
    await updateJobStatus(generationJobId, JobStatus.FAILED);

    logger.error('[ImageWorker] Failed to process image job', {
      generationJobId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
};
