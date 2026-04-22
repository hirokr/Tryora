import logger from '#src/config/logger.ts';
import { getHunyuanStatus } from '#src/client/hunyuan3d.client.ts';

const PIXAZO_POLL_INTERVAL_MS =
  Number(
    process.env.TRIPO_3D_POLL_INTERVAL_MS ||
      process.env.PIXAZO_3D_POLL_INTERVAL_MS
  ) || 10_000;
const PIXAZO_MAX_POLL_ATTEMPTS =
  Number(
    process.env.TRIPO_3D_MAX_POLL_ATTEMPTS ||
      process.env.PIXAZO_3D_MAX_POLL_ATTEMPTS
  ) || 30;

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const normalizeStatus = (status: string | undefined): string =>
  String(status || '').toUpperCase();

export const pollPixazo3DUntilComplete = async (
  requestId: string,
  generationJobId: string
): Promise<string> => {
  for (let attempt = 1; attempt <= PIXAZO_MAX_POLL_ATTEMPTS; attempt++) {
    const payload = await getHunyuanStatus(requestId);
    const status = normalizeStatus(payload.status);

    if (status === 'COMPLETED') {
      const outputUrl = payload.output?.media_url?.[0];

      if (!outputUrl) {
        throw new Error(
          `Pixazo job ${generationJobId} completed but returned no output URL.`
        );
      }

      return outputUrl;
    }

    if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
      throw new Error(
        `Pixazo job ${generationJobId} failed with status ${status}. ${payload.error || 'No error details provided.'}`
      );
    }

    logger.info('[ModelWorker] Pixazo job still processing', {
      generationJobId,
      requestId,
      attempt,
      maxAttempts: PIXAZO_MAX_POLL_ATTEMPTS,
      status,
    });

    if (attempt < PIXAZO_MAX_POLL_ATTEMPTS) {
      await sleep(PIXAZO_POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `Pixazo polling timed out after ${PIXAZO_MAX_POLL_ATTEMPTS} attempts for ${generationJobId}.`
  );
};
