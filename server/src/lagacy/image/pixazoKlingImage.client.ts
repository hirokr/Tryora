// import logger from '#src/config/logger.ts';
// import { buildPixazoHeaders, sleep } from '#src/utils/generateModel.ts';

// const DEFAULT_KLING_GENERATE_URL =
//   'https://gateway.pixazo.ai/kling-o1-image-208/v1/kling-o1-image-request';
// const DEFAULT_KLING_RESULT_URL =
//   'https://gateway.pixazo.ai/kling-o1-image-208/v1/kling-o1-image-request-result';

// const PIXAZO_KLING_GENERATE_URL =
//   process.env.PIXAZO_KLING_IMAGE_GENERATE_URL?.trim() ||
//   DEFAULT_KLING_GENERATE_URL;
// const PIXAZO_KLING_RESULT_URL =
//   process.env.PIXAZO_KLING_IMAGE_RESULT_URL?.trim() || DEFAULT_KLING_RESULT_URL;

// const pollIntervalFromEnv = Number(process.env.PIXAZO_KLING_POLL_INTERVAL_MS);
// const maxPollChecksFromEnv = Number(process.env.PIXAZO_KLING_MAX_POLL_CHECKS);

// const PIXAZO_KLING_POLL_INTERVAL_MS =
//   Number.isFinite(pollIntervalFromEnv) && pollIntervalFromEnv > 0
//     ? Math.floor(pollIntervalFromEnv)
//     : 3000;
// const PIXAZO_KLING_MAX_POLL_CHECKS =
//   Number.isFinite(maxPollChecksFromEnv) && maxPollChecksFromEnv > 0
//     ? Math.floor(maxPollChecksFromEnv)
//     : 60;

// const MAX_RATE_LIMIT_RETRIES = 3;
// const RATE_LIMIT_BACKOFF_BASE_MS = 1200;
// const MAX_RATE_LIMIT_BACKOFF_MS = 10000;

// const COMPLETED_STATUSES = new Set(['COMPLETED', 'DONE', 'SUCCESS']);
// const FAILED_STATUSES = new Set(['FAILED', 'ERROR', 'CANCELLED']);

// type PixazoKlingRequestResponse = {
//   request_id?: string;
//   requestId?: string;
//   id?: string;
//   status?: string;
//   message?: string;
// };

// type PixazoKlingResultResponse = {
//   status?: string;
//   message?: string;
//   output?: {
//     image_url?: string;
//     images?: Array<{
//       url?: string;
//     }>;
//     url?: string;
//   };
//   image_url?: string;
// };

// export type PixazoKlingImageInput = {
//   prompt: string;
//   imageUrls?: string[];
//   elements?: unknown[];
//   requestLabel?: string;
//   onRequestAccepted?: (requestId: string) => Promise<void> | void;
//   onPollingUpdate?: (update: PixazoKlingPollingUpdate) => Promise<void> | void;
// };

// export type PixazoKlingImageResult = {
//   requestId: string;
//   status: string;
//   outputUrl: string;
// };

// export type PixazoKlingPollingUpdate = {
//   requestId: string;
//   status: string;
//   pollCount: number;
//   maxPollChecks: number;
// };

// const runHookSafely = async (
//   callback: (() => Promise<void> | void) | undefined,
//   label: string
// ) => {
//   if (!callback) {
//     return;
//   }

//   try {
//     await callback();
//   } catch (error) {
//     logger.warn(`[Pixazo Kling] ${label} hook failed`, {
//       error: error instanceof Error ? error.message : String(error),
//     });
//   }
// };

// const readRetryAfterMs = (retryAfterHeader: string | null) => {
//   if (!retryAfterHeader) {
//     return null;
//   }

//   const asSeconds = Number(retryAfterHeader);
//   if (Number.isFinite(asSeconds) && asSeconds >= 0) {
//     return Math.round(asSeconds * 1000);
//   }

//   const retryAfterDate = Date.parse(retryAfterHeader);
//   if (Number.isNaN(retryAfterDate)) {
//     return null;
//   }

//   const delayMs = retryAfterDate - Date.now();
//   return delayMs > 0 ? delayMs : 0;
// };

// const computeRateLimitBackoffMs = (
//   retryAfterHeader: string | null,
//   retryCount: number
// ) => {
//   const retryAfterMs = readRetryAfterMs(retryAfterHeader);
//   if (retryAfterMs !== null) {
//     return Math.min(retryAfterMs, MAX_RATE_LIMIT_BACKOFF_MS);
//   }

//   const exponential = RATE_LIMIT_BACKOFF_BASE_MS * 2 ** retryCount;
//   return Math.min(exponential, MAX_RATE_LIMIT_BACKOFF_MS);
// };

// const readStatus = (payload: { status?: string }) => {
//   if (typeof payload.status !== 'string') {
//     return 'UNKNOWN';
//   }

//   const status = payload.status.trim().toUpperCase();
//   return status || 'UNKNOWN';
// };

// const readRequestId = (payload: PixazoKlingRequestResponse) => {
//   const requestId = payload.request_id || payload.requestId || payload.id;
//   return typeof requestId === 'string' && requestId.length > 0
//     ? requestId
//     : null;
// };

// const readOutputUrl = (payload: PixazoKlingResultResponse) => {
//   const outputUrl =
//     payload.output?.image_url ||
//     payload.output?.images?.[0]?.url ||
//     payload.output?.url ||
//     payload.image_url;

//   return typeof outputUrl === 'string' && outputUrl.length > 0
//     ? outputUrl
//     : null;
// };

// const postJsonWithRateLimitRetries = async (
//   url: string,
//   body: Record<string, unknown>,
//   requestLabel: string
// ): Promise<Response> => {
//   let rateLimitRetryCount = 0;

//   while (true) {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         ...buildPixazoHeaders(true),
//         'Cache-Control': 'no-cache',
//       },
//       body: JSON.stringify(body),
//     });

//     if (
//       response.status !== 429 ||
//       rateLimitRetryCount >= MAX_RATE_LIMIT_RETRIES
//     ) {
//       return response;
//     }

//     const retryDelayMs = computeRateLimitBackoffMs(
//       response.headers.get('retry-after'),
//       rateLimitRetryCount
//     );

//     logger.warn(`[Pixazo Kling] ${requestLabel} rate-limited, retrying`, {
//       status: response.status,
//       retryDelayMs,
//       retryCount: rateLimitRetryCount + 1,
//     });

//     rateLimitRetryCount += 1;
//     await sleep(retryDelayMs);
//   }
// };

// const parseJsonResponse = async <T>(
//   response: Response,
//   errorPrefix: string
// ): Promise<T> => {
//   if (!response.ok) {
//     const errorPayload = await response.text();
//     throw new Error(
//       `${errorPrefix} (status ${response.status}): ${errorPayload}`
//     );
//   }

//   return response.json() as Promise<T>;
// };

// const createKlingRequest = async (input: PixazoKlingImageInput) => {
//   const response = await postJsonWithRateLimitRetries(
//     PIXAZO_KLING_GENERATE_URL,
//     {
//       prompt: input.prompt,
//       image_urls: input.imageUrls || [],
//       ...(input.elements && input.elements.length > 0
//         ? { elements: input.elements }
//         : {}),
//     },
//     `${input.requestLabel || 'Kling request'} submission`
//   );

//   const payload = await parseJsonResponse<PixazoKlingRequestResponse>(
//     response,
//     'Pixazo Kling request failed'
//   );

//   const requestId = readRequestId(payload);
//   if (!requestId) {
//     throw new Error(
//       'Pixazo Kling request succeeded but no request_id was returned.'
//     );
//   }

//   return requestId;
// };

// const pollKlingResult = async (
//   requestId: string,
//   requestLabel: string,
//   onPollingUpdate?: (update: PixazoKlingPollingUpdate) => Promise<void> | void
// ): Promise<PixazoKlingImageResult> => {
//   for (
//     let pollCount = 0;
//     pollCount < PIXAZO_KLING_MAX_POLL_CHECKS;
//     pollCount += 1
//   ) {
//     if (pollCount > 0) {
//       await sleep(PIXAZO_KLING_POLL_INTERVAL_MS);
//     }

//     const response = await postJsonWithRateLimitRetries(
//       PIXAZO_KLING_RESULT_URL,
//       {
//         request_id: requestId,
//       },
//       `${requestLabel} result polling`
//     );

//     const payload = await parseJsonResponse<PixazoKlingResultResponse>(
//       response,
//       'Pixazo Kling result poll failed'
//     );

//     const status = readStatus(payload);
//     const outputUrl = readOutputUrl(payload);
//     const pollNumber = pollCount + 1;

//     await runHookSafely(
//       onPollingUpdate
//         ? () =>
//             onPollingUpdate({
//               requestId,
//               status,
//               pollCount: pollNumber,
//               maxPollChecks: PIXAZO_KLING_MAX_POLL_CHECKS,
//             })
//         : undefined,
//       `${requestLabel} polling update`
//     );

//     if (outputUrl && COMPLETED_STATUSES.has(status)) {
//       return {
//         requestId,
//         status,
//         outputUrl,
//       };
//     }

//     if (FAILED_STATUSES.has(status)) {
//       const message =
//         typeof payload.message === 'string' && payload.message.length > 0
//           ? payload.message
//           : 'Generation failed';

//       throw new Error(
//         `Pixazo Kling request failed with status ${status}: ${message}`
//       );
//     }

//     if (outputUrl) {
//       return {
//         requestId,
//         status,
//         outputUrl,
//       };
//     }

//     logger.info(`[Pixazo Kling] ${requestLabel} is still processing`, {
//       requestId,
//       status,
//       pollCount: pollNumber,
//       maxPollChecks: PIXAZO_KLING_MAX_POLL_CHECKS,
//     });
//   }

//   throw new Error(
//     `Pixazo Kling result polling timed out after ${PIXAZO_KLING_MAX_POLL_CHECKS} checks.`
//   );
// };

// export const generatePixazoKlingImage = async (
//   input: PixazoKlingImageInput
// ): Promise<PixazoKlingImageResult> => {
//   if (!input.prompt || !input.prompt.trim()) {
//     throw new Error('Prompt is required for Pixazo Kling image generation.');
//   }

//   const requestLabel = input.requestLabel || 'Kling image request';

//   logger.info(`[Pixazo Kling] Submitting ${requestLabel}`, {
//     endpoint: PIXAZO_KLING_GENERATE_URL,
//     imageUrlsCount: input.imageUrls?.length || 0,
//   });

//   const requestId = await createKlingRequest(input);

//   logger.info(`[Pixazo Kling] Request accepted for ${requestLabel}`, {
//     requestId,
//   });

//   const onRequestAccepted = input.onRequestAccepted;

//   await runHookSafely(
//     onRequestAccepted ? () => onRequestAccepted(requestId) : undefined,
//     `${requestLabel} request accepted`
//   );

//   return pollKlingResult(requestId, requestLabel, input.onPollingUpdate);
// };
