import fetch from 'node-fetch';
import { JobType } from '#src/generated/enums.ts';
import { ClaidTaskStatusResponse, claidStatus } from '#src/types/typesimage.js';

const CLAID_API_BASE_URL = 'https://api.claid.ai';
const CLAID_POLL_INTERVAL_MS = 10_000;
const CLAID_POLL_REQUEST_TIMEOUT_MS =
  Number(process.env.CLAID_POLL_REQUEST_TIMEOUT_MS) || 15_000;
const CLAID_MAX_POLL_ATTEMPTS =
  Number(process.env.CLAID_MAX_POLL_ATTEMPTS) || 8;
const CLAID_API_KEY = process.env.CLAID_API_KEY;

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const buildStatusUrl = (jobType: JobType, taskId: string): string => {
  const endpoint =
    jobType === JobType.IMAGE_TRYON ? 'ai-fashion-models' : 'ai-edit';
  return `${CLAID_API_BASE_URL}/v1/image/${endpoint}/${encodeURIComponent(taskId)}`;
};

export const pollClaidUntilComplete = async (
  jobType: JobType,
  taskId: string,
  generationJobId: string
): Promise<string> => {
  if (!CLAID_API_KEY) {
    throw new Error('CLAID_API_KEY is not configured.');
  }

  const statusUrl = buildStatusUrl(jobType, taskId);

  for (let attempt = 1; attempt <= CLAID_MAX_POLL_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CLAID_POLL_REQUEST_TIMEOUT_MS
    );

    let response;
    try {
      response = await fetch(statusUrl, {
        headers: { Authorization: `Bearer ${CLAID_API_KEY}` },
        signal: controller.signal,
      });
    } catch (error) {
      if (attempt < CLAID_MAX_POLL_ATTEMPTS) {
        await sleep(CLAID_POLL_INTERVAL_MS);
        continue;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Claid polling request failed for ${generationJobId} after ${CLAID_MAX_POLL_ATTEMPTS} attempts: ${message}`
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Claid polling failed for ${generationJobId} (HTTP ${response.status}): ${body}`
      );
    }

    const payload = (await response.json()) as ClaidTaskStatusResponse;
    const taskData = payload.data;

    if (!taskData) {
      throw new Error(
        `Claid polling returned invalid payload for ${generationJobId}.`
      );
    }

    const status = taskData.status;

    if (status === claidStatus.done) {
      const resultUrl = taskData.result?.output_objects?.[0]?.tmp_url;
      if (!resultUrl) {
        throw new Error(
          `Claid task completed without output URL for ${generationJobId}.`
        );
      }

      return resultUrl;
    }

    if (
      status === claidStatus.error ||
      status === claidStatus.cancelled ||
      status === claidStatus.paused
    ) {
      const errorMessage = taskData.errors
        ?.map(item => item.error)
        .filter(Boolean)
        .join(' | ');

      throw new Error(
        `Claid task failed for ${generationJobId} with status ${status}. ${errorMessage || 'No error details provided.'}`
      );
    }

    if (
      status !== claidStatus.accepted &&
      status !== claidStatus.waiting &&
      status !== claidStatus.processing
    ) {
      throw new Error(
        `Claid task returned unsupported status ${status} for ${generationJobId}.`
      );
    }

    if (attempt < CLAID_MAX_POLL_ATTEMPTS) {
      await sleep(CLAID_POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `Claid polling timed out after ${CLAID_MAX_POLL_ATTEMPTS} attempts for ${generationJobId}.`
  );
};
