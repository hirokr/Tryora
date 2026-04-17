import { Worker, type Job } from 'bullmq';
import logger from '#src/config/logger.ts';
import { bullmqConnection } from '#src/queues/bullmq.connection.ts';
import {
  MODEL_3D_QUEUE_NAME,
  type Generate3DModelJobData,
} from '#src/queues/3dmodel.job.ts';
import {
  complete3DGenerationJob,
  mark3DJobAsProcessing,
  mark3DJobFailedState,
  set3DJobThirdPartyTask,
  update3DJobProgress,
} from '#src/services/model.service.ts';
import {
  getHunyuanStatus,
  startHunyuan3DGeneration,
} from '#src/client/hunyuan3d.client.ts';
import { sleep } from '#src/utils/generate3D.ts';
import { mirror3DModelToOwnedStorage } from '#src/services/modelStorage.service.ts';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const process3DModelJob = async (job: Job<Generate3DModelJobData>) => {
  const { generationJobId, tryonResultId, imageUri, prompt, userId } = job.data;

  await mark3DJobAsProcessing(generationJobId, job.attemptsMade);

  const thirdPartyTaskId = await startHunyuan3DGeneration(imageUri, prompt);

  await set3DJobThirdPartyTask(generationJobId, thirdPartyTaskId);

  const startedPollingAt = Date.now();

  while (Date.now() - startedPollingAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const status = await getHunyuanStatus(thirdPartyTaskId);

    if (status.status === 'succeeded') {
      const modelUrl = status.output?.model_url;

      if (!modelUrl) {
        throw new Error('Generation succeeded but model_url is missing');
      }

      await update3DJobProgress(generationJobId, 96, 'uploading_to_storage');

      const mirroredModel = await mirror3DModelToOwnedStorage({
        sourceUrl: modelUrl,
        userId,
        tryonResultId,
        generationJobId,
      });

      await complete3DGenerationJob(
        generationJobId,
        tryonResultId,
        mirroredModel.url,
        status.output?.preview_url || null
      );

      return {
        generationJobId,
        thirdPartyTaskId,
        modelUrl: mirroredModel.url,
      };
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Third-party 3D generation failed');
    }

    const elapsedMs = Date.now() - startedPollingAt;
    const progress = Math.min(
      95,
      Math.floor((elapsedMs / POLL_TIMEOUT_MS) * 100)
    );

    await update3DJobProgress(
      generationJobId,
      Math.max(progress, 10),
      status.status
    );
  }

  throw new Error('3D generation timed out while polling third-party status');
};

export const model3DWorker = new Worker<Generate3DModelJobData>(
  MODEL_3D_QUEUE_NAME,
  process3DModelJob,
  {
    connection: bullmqConnection,
    concurrency: Number(process.env.MODEL3D_WORKER_CONCURRENCY || 2),
  }
);

model3DWorker.on('ready', () => {
  logger.info('[BullMQ] 3D worker is ready');
});

model3DWorker.on('completed', job => {
  logger.info(`[BullMQ] Completed 3D job ${job.id}`);
});

model3DWorker.on('failed', async (job, error) => {
  if (!job) {
    logger.error(
      `[BullMQ] Worker failure without job context: ${error.message}`
    );
    return;
  }

  const attemptsConfigured = job.opts.attempts || 1;
  const hasRetryLeft = job.attemptsMade < attemptsConfigured;

  try {
    await mark3DJobFailedState(
      job.data.generationJobId,
      hasRetryLeft,
      job.attemptsMade,
      error.message
    );
  } catch (updateError) {
    logger.error(
      `[BullMQ] Failed to persist failed state for job ${job.id}: ${String(updateError)}`
    );
  }

  logger.error(
    `[BullMQ] Failed 3D job ${job.id} (attempt ${job.attemptsMade}/${attemptsConfigured}): ${error.message}`
  );
});

export const close3DModelWorker = async () => {
  await model3DWorker.close();
};
