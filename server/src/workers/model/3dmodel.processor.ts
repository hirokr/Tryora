import type { Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { JobStatus } from '#src/generated/browser.ts';
import {
  getJobById,
  updateJobResult,
  updateJobStatus,
} from '#src/services/job.service.ts';
import type { Generate3DModelJobData } from '#src/types/3d.js';
import { pollPixazo3DUntilComplete } from './3dmodel.poller.ts';

export const process3DModelJob = async (
  queueJob: Job<Generate3DModelJobData>
): Promise<void> => {
  const { generationJobId } = queueJob.data;
  let jobId = generationJobId;

  try {
    const generationJob = await getJobById(generationJobId);
    jobId = generationJob.id;

    if (!generationJob.thirdPartyTaskId) {
      throw new Error(`Missing Pixazo request ID for job ${generationJobId}.`);
    }

    await updateJobStatus(jobId, JobStatus.PROCESSING);

    logger.info('[ModelWorker] Polling Pixazo for 3D model result', {
      generationJobId,
      requestId: generationJob.thirdPartyTaskId,
    });

    const modelUrl = await pollPixazo3DUntilComplete(
      generationJob.thirdPartyTaskId,
      generationJobId
    );

    await updateJobResult(jobId, modelUrl);

    logger.info('[ModelWorker] 3D model generation completed', {
      generationJobId,
      modelUrl,
    });
  } catch (error) {
    await updateJobStatus(jobId, JobStatus.FAILED);

    logger.error('[ModelWorker] Failed to process 3D model job', {
      generationJobId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
};
