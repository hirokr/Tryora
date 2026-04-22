import fetch from 'node-fetch';
import logger from '#src/config/logger.ts';
import { ClaidApiResponse, claidStatus } from '#src/types/typesimage.ts';

const CLAID_API_KEY = process.env.CLAID_API_KEY;

export async function tryOnImageClaid(
  modelImage: string,
  productImagePaths: string[]
): Promise<ClaidApiResponse> {
  try {
    if (!CLAID_API_KEY) {
      throw new Error('CLAID_API_KEY is not configured.');
    }

    const normalizedModelImage = modelImage?.trim();
    const normalizedProductImagePaths = productImagePaths
      .map(path => path?.trim())
      .filter(Boolean);

    if (!normalizedModelImage) {
      throw new Error('Model image is required.');
    }

    if (!normalizedProductImagePaths.length) {
      throw new Error('At least one product image path is required.');
    }

    if (normalizedProductImagePaths.length > 5) {
      throw new Error('A maximum of 5 product image paths is supported.');
    }

    const response = await fetch(
      'https://api.claid.ai/v1/image/ai-fashion-models',
      {
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
            model: normalizedModelImage,
            clothing: normalizedProductImagePaths,
          },
          options: {
            background: 'minimalistic studio background',
            pose: 'full body, front view, neutral stance, arms relaxed',
            aspect_ratio: '9:16',
          },
        }),
      }
    );
    const claidResponse = (await response.json()) as ClaidApiResponse & {
      error_message?: string;
      detail?: string;
      message?: string;
      error_code?: string;
      error_type?: string;
    };

    if (!response.ok) {
      const apiError =
        claidResponse.error_message ??
        claidResponse.detail ??
        claidResponse.message;
      throw new Error(
        `API Error: failed to start image fusion (${response.status} ${response.statusText})${
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
    logger.error('Image fusion request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(error);
    throw error;
  }
}
