import type { Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import type { ProductImageEditJobData } from '#src/queues/Image.queue.ts';
import { pollClaidUntilComplete } from './claid.poller.ts';
// import {
//   markJobAsProcessing,
//   markJobAsFailed,
//   persistCompletedJob,
// } from '#src/services/job.service.ts';

import { handleUrlUpload } from '#src/utils/uploadthings.ts';

findjob

export const processImageJob = async (
  queueJob: Job<ProductImageEditJobData>
): Promise<void> => {
  const { generationJobId, params } = queueJob.data;

  try {
    const { id: jobId, thirdPartyTaskId } =
      await findJobWithTaskId(generationJobId);

    await markJobAsProcessing(jobId);

    logger.info('[ImageWorker] Polling Claid for result', {
      generationJobId,
      thirdPartyTaskId,
      pollIntervalMs: 10_000,
    });

    const claidResultUrl = await pollClaidUntilComplete(
      params.jobType,
      thirdPartyTaskId,
      generationJobId
    );

    const data = await handleUrlUpload(
      claidResultUrl,
      `tryon-${generationJobId}.png`
    );

    await persistCompletedJob(queueJob.data, data[0]);

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
