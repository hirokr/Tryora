import fetch from 'node-fetch';
import logger from '#src/config/logger.ts';
import {
  ProductAppearanceEditApiRequest,
  ProductAppearanceEditApiResult,
} from '#src/types/productImageEdit.js';

const CLAID_API_KEY = process.env.CLAID_API_KEY?.trim();
const CLAID_OUTPUT_DESTINATION = process.env.CLAID_OUTPUT_DESTINATION?.trim();
const CLAID_API_BASE_URL =
  process.env.CLAID_API_BASE_URL?.trim() || 'https://api.claid.ai';

const pollIntervalFromEnv = Number(process.env.CLAID_AI_EDIT_POLL_INTERVAL_MS);
const maxPollChecksFromEnv = Number(process.env.CLAID_AI_EDIT_MAX_POLL_CHECKS);

const CLAID_AI_EDIT_POLL_INTERVAL_MS =
  Number.isFinite(pollIntervalFromEnv) && pollIntervalFromEnv > 0
    ? Math.floor(pollIntervalFromEnv)
    : 1500;
const CLAID_AI_EDIT_MAX_POLL_CHECKS =
  Number.isFinite(maxPollChecksFromEnv) && maxPollChecksFromEnv > 0
    ? Math.floor(maxPollChecksFromEnv)
    : 40;

const MAX_ASPECT_RATIO_RETRIES = 1;
const MAX_RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_BACKOFF_BASE_MS = 1200;
const MAX_RATE_LIMIT_BACKOFF_MS = 10000;

type ClaidEditApiResponse = {
  data?: {
    id?: number;
    status?: string;
    result_url?: string;
    output_url?: string;
    errors?: Array<{
      error?: string;
      created_at?: string;
    }>;
    result?: {
      output_objects?: Array<{
        tmp_url?: string;
        object_uri?: string;
        claid_storage_uri?: string;
      }>;
    };
  };
  output?: {
    images?: Array<{
      url?: string;
    }>;
    url?: string;
  };
};

type ClaidValidationErrorPayload = {
  error_details?: Record<string, string[] | undefined>;
};

const sleep = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const readRetryAfterMs = (retryAfterHeader: string | null) => {
  if (!retryAfterHeader) {
    return null;
  }

  const asSeconds = Number(retryAfterHeader);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.round(asSeconds * 1000);
  }

  const retryAfterDate = Date.parse(retryAfterHeader);
  if (Number.isNaN(retryAfterDate)) {
    return null;
  }

  const delayMs = retryAfterDate - Date.now();
  return delayMs > 0 ? delayMs : 0;
};

const isRateLimitErrorPayload = (errorPayloadText: string) => {
  try {
    const payload = JSON.parse(errorPayloadText) as {
      error_message?: unknown;
      error_type?: unknown;
    };

    return (
      payload.error_type === 'rate_limit' ||
      (typeof payload.error_message === 'string' &&
        payload.error_message.toLowerCase().includes('too many requests'))
    );
  } catch {
    return false;
  }
};

const computeRateLimitBackoffMs = (
  retryAfterHeader: string | null,
  retryCount: number
) => {
  const retryAfterMs = readRetryAfterMs(retryAfterHeader);
  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, MAX_RATE_LIMIT_BACKOFF_MS);
  }

  const exponential = RATE_LIMIT_BACKOFF_BASE_MS * 2 ** retryCount;
  return Math.min(exponential, MAX_RATE_LIMIT_BACKOFF_MS);
};

const shouldRetryWithoutAspectRatio = (errorPayloadText: string) => {
  try {
    const payload = JSON.parse(errorPayloadText) as ClaidValidationErrorPayload;
    const aspectRatioErrors = payload.error_details?.['options.aspect_ratio'];

    return Array.isArray(aspectRatioErrors) && aspectRatioErrors.length > 0;
  } catch {
    return false;
  }
};

const buildEditRequestBody = (
  input: ProductAppearanceEditApiRequest,
  includeAspectRatio: boolean
) => {
  const options: {
    model: ProductAppearanceEditApiRequest['model'];
    prompt: string;
    aspect_ratio?: string;
    inference_steps?: number;
    guidance_scale?: number;
  } = {
    model: input.model,
    prompt: input.prompt,
  };

  if (input.model === 'v1') {
    if (includeAspectRatio && input.aspectRatio) {
      options.aspect_ratio = input.aspectRatio;
    }

    if (input.inferenceSteps !== undefined) {
      options.inference_steps = input.inferenceSteps;
    }

    if (input.guidanceScale !== undefined) {
      options.guidance_scale = input.guidanceScale;
    }
  }

  return {
    output: {
      number_of_images: 1,
      format: input.format,
      ...(CLAID_OUTPUT_DESTINATION
        ? { destination: CLAID_OUTPUT_DESTINATION }
        : {}),
    },
    input: input.inputImage,
    options,
  };
};

const buildAiEditStatusUrl = (payload: ClaidEditApiResponse) => {
  const resultUrl = payload.data?.result_url;

  if (resultUrl) {
    try {
      const parsedUrl = new URL(resultUrl);

      // Claid can return an HTTP status URL; keep auth headers by polling HTTPS directly.
      if (
        parsedUrl.protocol === 'http:' &&
        parsedUrl.hostname === 'api.claid.ai'
      ) {
        parsedUrl.protocol = 'https:';
        return parsedUrl.toString();
      }

      return parsedUrl.toString();
    } catch {
      return resultUrl;
    }
  }

  const taskId = payload.data?.id;

  if (typeof taskId === 'number') {
    return `${CLAID_API_BASE_URL}/v1/image/ai-edit/${taskId}`;
  }

  return null;
};

const readAiEditStatus = (payload: ClaidEditApiResponse) => {
  const status = payload.data?.status;
  return typeof status === 'string' ? status.toUpperCase() : null;
};

const readAiEditErrors = (payload: ClaidEditApiResponse) => {
  const errors = payload.data?.errors || [];

  return errors
    .map(item => item.error)
    .filter(
      (message): message is string =>
        typeof message === 'string' && message.length > 0
    );
};

const readOutputUrl = (payload: ClaidEditApiResponse): string | null => {
  const asyncOutputObject = payload.data?.result?.output_objects?.[0];

  return (
    payload.data?.output_url ||
    asyncOutputObject?.tmp_url ||
    asyncOutputObject?.object_uri ||
    asyncOutputObject?.claid_storage_uri ||
    payload.output?.images?.[0]?.url ||
    payload.output?.url ||
    null
  );
};

const pollAiEditResultUrl = async (statusUrl: string): Promise<string> => {
  let pollCount = 0;
  let rateLimitRetryCount = 0;

  logger.info('[Product Ai Edit] Polling Claid result URL', {
    statusUrl,
  });

  while (pollCount < CLAID_AI_EDIT_MAX_POLL_CHECKS) {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CLAID_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      const isRateLimited =
        response.status === 429 || isRateLimitErrorPayload(errorPayload);

      if (isRateLimited && rateLimitRetryCount < MAX_RATE_LIMIT_RETRIES) {
        const retryDelayMs = computeRateLimitBackoffMs(
          response.headers.get('retry-after'),
          rateLimitRetryCount
        );

        logger.warn('[Product Ai Edit] Claid poll rate-limited, retrying', {
          status: response.status,
          retryDelayMs,
          retryCount: rateLimitRetryCount + 1,
          claidRequestId: response.headers.get('x-request-id') || null,
        });

        rateLimitRetryCount += 1;
        await sleep(retryDelayMs);
        continue;
      }

      throw new Error(
        `Product ai-edit status check failed (status ${response.status}): ${errorPayload}`
      );
    }

    rateLimitRetryCount = 0;

    const payload = (await response.json()) as ClaidEditApiResponse;
    const outputUrl = readOutputUrl(payload);

    if (outputUrl) {
      logger.info('[Product Ai Edit] Claid returned output URL from polling');
      return outputUrl;
    }

    const status = readAiEditStatus(payload);

    if (status === 'ERROR' || status === 'CANCELLED' || status === 'PAUSED') {
      const joinedErrors = readAiEditErrors(payload).join('; ');

      throw new Error(
        joinedErrors
          ? `Product ai-edit failed with status ${status}: ${joinedErrors}`
          : `Product ai-edit failed with status ${status}`
      );
    }

    if (status === 'DONE') {
      throw new Error(
        'AI edit completed but did not include output image URL.'
      );
    }

    pollCount += 1;
    await sleep(CLAID_AI_EDIT_POLL_INTERVAL_MS);
  }

  throw new Error(
    `AI edit result polling timed out after ${CLAID_AI_EDIT_MAX_POLL_CHECKS} checks.`
  );
};

export const editProductImageWithAiClaidLegacy = async (
  input: ProductAppearanceEditApiRequest
): Promise<ProductAppearanceEditApiResult> => {
  if (!CLAID_API_KEY) {
    throw new Error('CLAID_API_KEY is not configured.');
  }

  let includeAspectRatio = Boolean(input.aspectRatio);
  let aspectRatioRetryCount = 0;
  let rateLimitRetryCount = 0;

  while (true) {
    logger.info('[Product Ai Edit] Calling Claid AI Edit API', {
      endpoint: `${CLAID_API_BASE_URL}/v1/image/ai-edit`,
      model: input.model,
      format: input.format,
      hasAspectRatio: includeAspectRatio && Boolean(input.aspectRatio),
    });

    const response = await fetch(`${CLAID_API_BASE_URL}/v1/image/ai-edit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLAID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildEditRequestBody(input, includeAspectRatio)),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      const isRateLimited =
        response.status === 429 || isRateLimitErrorPayload(errorPayload);

      if (isRateLimited && rateLimitRetryCount < MAX_RATE_LIMIT_RETRIES) {
        const retryDelayMs = computeRateLimitBackoffMs(
          response.headers.get('retry-after'),
          rateLimitRetryCount
        );

        logger.warn('[Product Ai Edit] Claid request rate-limited, retrying', {
          status: response.status,
          retryDelayMs,
          retryCount: rateLimitRetryCount + 1,
          claidRequestId: response.headers.get('x-request-id') || null,
        });

        rateLimitRetryCount += 1;
        await sleep(retryDelayMs);
        continue;
      }

      if (
        includeAspectRatio &&
        shouldRetryWithoutAspectRatio(errorPayload) &&
        aspectRatioRetryCount < MAX_ASPECT_RATIO_RETRIES
      ) {
        includeAspectRatio = false;
        aspectRatioRetryCount += 1;
        continue;
      }

      throw new Error(
        `Product ai-edit failed (status ${response.status}, request-id ${response.headers.get('x-request-id') || 'n/a'}): ${errorPayload}`
      );
    }

    const payload = (await response.json()) as ClaidEditApiResponse;
    const directOutputUrl = readOutputUrl(payload);

    if (directOutputUrl) {
      return { outputUrl: directOutputUrl };
    }

    const statusUrl = buildAiEditStatusUrl(payload);

    if (!statusUrl) {
      throw new Error(
        'AI edit response did not include output image URL or result polling URL.'
      );
    }

    const outputUrl = await pollAiEditResultUrl(statusUrl);
    return { outputUrl };
  }
};
