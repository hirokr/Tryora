import fetch from 'node-fetch';
import logger from '#src/config/logger.ts';
import {
  ClaidApiResponse,
  ClaidImageEditRequest,
  claidStatus,
} from '#src/types/typesimage.ts';

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
        // Claid AI Edit expects input as a string URL, not a nested object.
        input: productImageUrl,
        options: {
          prompt: userPrompt,
        },
      }),
    });
    const claidResponse = (await response.json()) as ClaidApiResponse & {
      error_message?: string;
      detail?: string;
      message?: string;
    };

    if (!response.ok) {
      const apiError =
        claidResponse.error_message ??
        claidResponse.detail ??
        claidResponse.message;
      throw new Error(
        `API Error: failed to edit image (${response.status} ${response.statusText})${
          apiError ? ` - ${apiError}` : ''
        }`
      );
    }

    if (claidResponse.data?.status !== claidStatus.accepted) {
      throw new Error(
        `API Error: unexpected Claid status: ${String(claidResponse.data?.status)}`
      );
    }

    if (!claidResponse.data?.id) {
      throw new Error('API Error: missing processing request id from Claid.');
    }

    return claidResponse;
  } catch (error) {
    logger.error('Image edit request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

