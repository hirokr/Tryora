import fetch from 'node-fetch';
import logger from '#src/config/logger.ts';
import { ClaidApiResponse, claidStatus } from '#src/types/image.js';

const CLAID_API_KEY = process.env.CLAID_API_KEY;

export async function tryOnImageClaid(
  modelImage: String,
  productImagePaths: String[]
): Promise<ClaidApiResponse | undefined> {
  try {
    if (!CLAID_API_KEY) {
      throw new Error('CLAID_API_KEY is not configured.');
    }
    if (!productImagePaths || productImagePaths.length === 0) {
      throw new Error('At least one product image path is required.');
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
            model: modelImage,
            clothing: productImagePaths,
          },
          options: {
            background: 'minimalistic studio background',
            pose: 'full body, front view, neutral stance, arms relaxed',
            aspect_ratio: '9:16',
          },
        }),
      }
    );
    const claidResponse = (await response.json()) as ClaidApiResponse;

    if (!response.ok) {
      if (claidResponse.data?.status !== claidStatus.accepted) {
        throw new Error(`API Error: failed to edit image`);
      }

      return claidResponse;
    }
  } catch (error) {
    logger.error('Try-on generation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
