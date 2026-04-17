// import { randomUUID } from 'node:crypto';
// import logger from '#src/config/logger.ts';

// const GEMINI_API_BASE_URL =
//   process.env.GEMINI_API_BASE_URL?.trim() ||
//   'https://generativelanguage.googleapis.com/v1beta';
// const DEFAULT_GEMINI_IMAGE_MODEL =
//   process.env.GEMINI_IMAGE_MODEL_DEFAULT?.trim() ||
//   'gemini-3.1-flash-image-preview';

// const MAX_REFERENCE_IMAGES = 14;
// const MAX_RATE_LIMIT_RETRIES = 3;
// const RATE_LIMIT_BACKOFF_BASE_MS = 1200;
// const MAX_RATE_LIMIT_BACKOFF_MS = 10000;

// type GeminiInlineDataPart = {
//   inline_data: {
//     mime_type: string;
//     data: string;
//   };
// };

// type GeminiGenerateResponse = {
//   candidates?: Array<{
//     content?: {
//       parts?: Array<{
//         thought?: boolean;
//         text?: string;
//         inlineData?: {
//           mimeType?: string;
//           data?: string;
//         };
//         inline_data?: {
//           mime_type?: string;
//           data?: string;
//         };
//       }>;
//     };
//     finishReason?: string;
//   }>;
//   promptFeedback?: {
//     blockReason?: string;
//   };
// };

// export type GeminiImageSize = '512' | '1K' | '2K' | '4K';

// export type GeminiImagePollingUpdate = {
//   requestId: string;
//   status: string;
//   pollCount: number;
//   maxPollChecks: number;
// };

// export type GeminiImageInput = {
//   prompt: string;
//   imageUrls?: string[];
//   model?: string;
//   aspectRatio?: string;
//   imageSize?: GeminiImageSize;
//   requestLabel?: string;
//   onRequestAccepted?: (requestId: string) => Promise<void> | void;
//   onPollingUpdate?: (update: GeminiImagePollingUpdate) => Promise<void> | void;
// };

// export type GeminiImageResult = {
//   requestId: string;
//   status: 'COMPLETED';
//   outputImageBytes: Buffer;
//   outputMimeType: string;
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
//     logger.warn(`[Gemini Image] ${label} hook failed`, {
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

// const sleep = (ms: number) =>
//   new Promise(resolve => {
//     setTimeout(resolve, ms);
//   });

// const resolveGeminiApiKey = () => {
//   const apiKey = process.env.GEMINI_API_KEY?.trim();
//   if (!apiKey) {
//     throw new Error('Missing GEMINI_API_KEY in environment variables.');
//   }

//   return apiKey;
// };

// const toMimeType = (value: string | null, fallbackUrl: string) => {
//   if (value && value.trim().length > 0) {
//     return value.split(';')[0].trim();
//   }

//   const lowerUrl = fallbackUrl.toLowerCase();
//   if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
//     return 'image/jpeg';
//   }

//   if (lowerUrl.endsWith('.webp')) {
//     return 'image/webp';
//   }

//   return 'image/png';
// };

// const buildInlineImagePart = async (
//   imageUrl: string
// ): Promise<GeminiInlineDataPart> => {
//   const response = await fetch(imageUrl);

//   if (!response.ok) {
//     throw new Error(
//       `Failed to fetch reference image (${response.status} ${response.statusText})`
//     );
//   }

//   const arrayBuffer = await response.arrayBuffer();
//   const bytes = Buffer.from(arrayBuffer);

//   if (!bytes.length) {
//     throw new Error('Fetched reference image is empty.');
//   }

//   return {
//     inline_data: {
//       mime_type: toMimeType(response.headers.get('content-type'), imageUrl),
//       data: bytes.toString('base64'),
//     },
//   };
// };

// const postGeminiWithRateLimitRetries = async (input: {
//   url: string;
//   apiKey: string;
//   body: Record<string, unknown>;
//   requestLabel: string;
// }) => {
//   let rateLimitRetryCount = 0;

//   while (true) {
//     const response = await fetch(input.url, {
//       method: 'POST',
//       headers: {
//         'x-goog-api-key': input.apiKey,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(input.body),
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

//     logger.warn('[Gemini Image] Request rate-limited, retrying', {
//       requestLabel: input.requestLabel,
//       retryDelayMs,
//       retryCount: rateLimitRetryCount + 1,
//     });

//     rateLimitRetryCount += 1;
//     await sleep(retryDelayMs);
//   }
// };

// const parseGeminiJsonResponse = async (response: Response) => {
//   if (!response.ok) {
//     const errorPayload = await response.text();
//     throw new Error(
//       `Gemini image request failed (status ${response.status}): ${errorPayload}`
//     );
//   }

//   return response.json() as Promise<GeminiGenerateResponse>;
// };

// const extractFirstImage = (payload: GeminiGenerateResponse) => {
//   const parts = payload.candidates?.[0]?.content?.parts || [];

//   for (const part of parts) {
//     const inlineData = part.inlineData || part.inline_data;
//     const mimeType =
//       part.inlineData?.mimeType || part.inline_data?.mime_type || 'image/png';
//     const data = inlineData?.data;

//     if (typeof data === 'string' && data.length > 0) {
//       return {
//         bytes: Buffer.from(data, 'base64'),
//         mimeType,
//       };
//     }
//   }

//   const blockReason = payload.promptFeedback?.blockReason;
//   if (blockReason) {
//     throw new Error(`Gemini blocked the image request: ${blockReason}`);
//   }

//   const finishReason = payload.candidates?.[0]?.finishReason;
//   throw new Error(
//     finishReason
//       ? `Gemini returned no image output (finish reason: ${finishReason}).`
//       : 'Gemini returned no image output.'
//   );
// };

// export const generateGeminiImage = async (
//   input: GeminiImageInput
// ): Promise<GeminiImageResult> => {
//   const prompt = input.prompt?.trim();
//   if (!prompt) {
//     throw new Error('Prompt is required for Gemini image generation.');
//   }

//   const imageUrls = input.imageUrls || [];
//   if (imageUrls.length > MAX_REFERENCE_IMAGES) {
//     throw new Error(
//       `Gemini supports up to ${MAX_REFERENCE_IMAGES} reference images per request.`
//     );
//   }

//   const model = input.model?.trim() || DEFAULT_GEMINI_IMAGE_MODEL;
//   const requestLabel = input.requestLabel || 'Gemini image request';
//   const requestId = randomUUID();
//   const apiKey = resolveGeminiApiKey();

//   logger.info('[Gemini Image] Preparing generation request', {
//     requestLabel,
//     model,
//     imageUrlsCount: imageUrls.length,
//   });

//   await runHookSafely(
//     input.onRequestAccepted
//       ? () => input.onRequestAccepted!(requestId)
//       : undefined,
//     `${requestLabel} request accepted`
//   );

//   const imageParts = await Promise.all(
//     imageUrls.map(url => buildInlineImagePart(url))
//   );

//   const generationConfig: {
//     responseModalities: string[];
//     imageConfig?: {
//       aspectRatio?: string;
//       imageSize?: GeminiImageSize;
//     };
//   } = {
//     responseModalities: ['IMAGE'],
//   };

//   if (input.aspectRatio || input.imageSize) {
//     generationConfig.imageConfig = {
//       ...(input.aspectRatio ? { aspectRatio: input.aspectRatio } : {}),
//       ...(input.imageSize ? { imageSize: input.imageSize } : {}),
//     };
//   }

//   const endpoint = `${GEMINI_API_BASE_URL}/models/${model}:generateContent`;

//   const response = await postGeminiWithRateLimitRetries({
//     url: endpoint,
//     apiKey,
//     requestLabel,
//     body: {
//       contents: [
//         {
//           role: 'user',
//           parts: [{ text: prompt }, ...imageParts],
//         },
//       ],
//       generationConfig,
//     },
//   });

//   const payload = await parseGeminiJsonResponse(response);
//   const image = extractFirstImage(payload);

//   await runHookSafely(
//     input.onPollingUpdate
//       ? () =>
//           input.onPollingUpdate!({
//             requestId,
//             status: 'COMPLETED',
//             pollCount: 1,
//             maxPollChecks: 1,
//           })
//       : undefined,
//     `${requestLabel} polling update`
//   );

//   return {
//     requestId,
//     status: 'COMPLETED',
//     outputImageBytes: image.bytes,
//     outputMimeType: image.mimeType,
//   };
// };
