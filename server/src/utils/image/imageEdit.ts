import fetch from 'node-fetch';
import logger from '#src/config/logger.ts';

import {
  ClaidApiResponse,
  ClaidImageEditRequest,
  claidStatus,
} from '#src/types/image.js';

const CLAID_API_KEY = process.env.CLAID_API_KEY;

export async function editProductImage({
  productImageUrl,
  userPrompt,
}: ClaidImageEditRequest): Promise<ClaidApiResponse | undefined> {
  try {
    if (!CLAID_API_KEY) {
      throw new Error('CLAID_API_KEY is not configured.');
    }

    if (!productImageUrl || !userPrompt) {
      throw new Error('Product image URL and user prompt are required.');
    }

    const response = await fetch('https://api.claid.ai/v1/image/ai-edit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLAID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        output: {
          number_of_images: 1,
          format: 'png',
        },
        input: {
          productImageUrl,
        },
        options: {
          prompt: userPrompt,
          aspect_ratio: '9:16',
        },
      }),
    });
    const claidResponse = (await response.json()) as ClaidApiResponse;

    const status = claidResponse.data?.status;

    if (!response.ok && status !== claidStatus.accepted) {
      throw new Error(`API Error: failed to edit image`);
    }

    if (!claidResponse.data?.id) {
      throw new Error('API Error: missing processing request id from Claid.');
    }

    return claidResponse;
  } catch (error) {
    logger.error('Try-on generation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
