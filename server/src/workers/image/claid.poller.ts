import fetch from 'node-fetch';
import type { ProductImageEditJobData } from '#src/queues/Image.queue.ts';

const CLAID_API_BASE_URL = 'https://api.claid.ai';
const CLAID_POLL_INTERVAL_MS = 10_000;
const CLAID_MAX_POLL_ATTEMPTS =
  Number(process.env.CLAID_MAX_POLL_ATTEMPTS) || 60;
const CLAID_API_KEY = process.env.CLAID_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

type ClaidJobType = ProductImageEditJobData['params']['jobType'];

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

type ClaidStatus =
  | 'DONE'
  | 'COMPLETED'
  | 'ERROR'
  | 'FAILED'
  | 'CANCELLED'
  | 'PAUSED'
  | string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const forceHttps = (url: string): string =>
  url.startsWith('http://api.claid.ai/')
    ? url.replace('http://', 'https://')
    : url;

const buildStatusUrl = (jobType: ClaidJobType, taskId: string): string => {
  const endpoint = jobType === 'image-fusion' ? 'ai-fashion-models' : 'ai-edit';
  return forceHttps(
    `${CLAID_API_BASE_URL}/v1/image/${endpoint}/${encodeURIComponent(taskId)}`
  );
};

// ─── Response Parsers ─────────────────────────────────────────────────────────

const parseStatus = (payload: ClaidPollResponse): ClaidStatus =>
  payload.data?.status?.toUpperCase() ?? payload.status?.toUpperCase() ?? '';

const parseErrors = (payload: ClaidPollResponse): string[] =>
  (payload.data?.errors ?? payload.errors ?? [])
    .map(e => e.error ?? e.message ?? '')
    .filter(Boolean);

const parseResultUrl = (payload: ClaidPollResponse): string | null => {
  const url =
    payload.data?.result_url ??
    payload.result_url ??
    payload.data?.result?.output_objects?.[0]?.tmp_url ??
    payload.data?.result?.output_objects?.[0]?.object_uri ??
    payload.result?.output_objects?.[0]?.tmp_url ??
    payload.result?.output_objects?.[0]?.object_uri ??
    payload.data?.output?.images?.[0]?.url ??
    payload.output?.images?.[0]?.url ??
    null;

  return url ? forceHttps(url) : null;
};

// ─── Poller ───────────────────────────────────────────────────────────────────

const TERMINAL_FAILURE_STATUSES = new Set([
  'ERROR',
  'FAILED',
  'CANCELLED',
  'PAUSED',
]);
const TERMINAL_SUCCESS_STATUSES = new Set(['DONE', 'COMPLETED']);

export const pollClaidUntilComplete = async (
  jobType: ClaidJobType,
  taskId: string,
  generationJobId: string
): Promise<string> => {
  if (!CLAID_API_KEY) {
    throw new Error('CLAID_API_KEY is not configured.');
  }

  const statusUrl = buildStatusUrl(jobType, taskId);

  for (let attempt = 0; attempt < CLAID_MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${CLAID_API_KEY}` },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Claid polling failed for ${generationJobId} (HTTP ${response.status}): ${body}`
      );
    }

    const payload = (await response.json()) as ClaidPollResponse;
    const status = parseStatus(payload);
    const resultUrl = parseResultUrl(payload);

    if (resultUrl && (TERMINAL_SUCCESS_STATUSES.has(status) || !status)) {
      return resultUrl;
    }

    if (TERMINAL_SUCCESS_STATUSES.has(status)) {
      throw new Error(
        `Claid returned ${status} for ${generationJobId} without a result URL.`
      );
    }

    if (TERMINAL_FAILURE_STATUSES.has(status)) {
      const reason = parseErrors(payload).join('; ');
      throw new Error(
        reason
          ? `Claid job failed (${status}): ${reason}`
          : `Claid job failed with status: ${status}`
      );
    }

    await sleep(CLAID_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Claid polling timed out after ${CLAID_MAX_POLL_ATTEMPTS} attempts for ${generationJobId}.`
  );
};
