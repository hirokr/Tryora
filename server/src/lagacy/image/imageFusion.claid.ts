import fetch from 'node-fetch';
import logger from '#src/config/logger.ts';
import { mirrorGeneratedImageToOwnedStorage } from '#src/services/imageStorage.service.ts';

const CLAID_API_KEY = process.env.CLAID_API_KEY;
const CLAID_OUTPUT_DESTINATION = process.env.CLAID_OUTPUT_DESTINATION;

interface TryOnRequest {
  personImagePath: string;
  garmentImagePaths: string[];
  category?: 'tops' | 'bottoms' | 'full_body';
  poser?: 'front' | 'side' | 'back';
}

interface ClaidResponse {
  data: {
    output_url: string;
  };
}

interface ClaidApiResponse {
  data?: {
    output_url?: string;
  };
  output?: {
    images?: Array<{
      url?: string;
    }>;
  };
}

const categoryPoseMap: Record<NonNullable<TryOnRequest['category']>, string> = {
  tops: 'upper body, neutral stance, arms relaxed',
  bottoms: 'full body, neutral stance, arms relaxed',
  full_body: 'full body, neutral stance, arms relaxed',
};

const poserPoseMap: Record<NonNullable<TryOnRequest['poser']>, string> = {
  front: 'front view',
  side: 'side view',
  back: 'back view',
};

export async function generateTryOnImageClaidLegacy({
  personImagePath,
  garmentImagePaths,
  category = 'tops',
  poser = 'front',
}: TryOnRequest): Promise<ClaidResponse> {
  try {
    if (!CLAID_API_KEY) {
      throw new Error('CLAID_API_KEY is not configured.');
    }

    if (!garmentImagePaths.length) {
      throw new Error('At least one garment image path is required.');
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
            ...(CLAID_OUTPUT_DESTINATION
              ? { destination: CLAID_OUTPUT_DESTINATION }
              : {}),
          },
          input: {
            model: personImagePath,
            clothing: garmentImagePaths,
          },
          options: {
            pose: `${categoryPoseMap[category]}, ${poserPoseMap[poser]}`,
            background: 'minimalistic studio background',
            aspect_ratio: '9:16',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${errText}`);
    }

    const claidResponse = (await response.json()) as ClaidApiResponse;
    const outputUrl =
      claidResponse.data?.output_url ?? claidResponse.output?.images?.[0]?.url;

    if (!outputUrl) {
      throw new Error('CLAID response did not include an output image URL.');
    }

    const storedImage = await mirrorGeneratedImageToOwnedStorage({
      sourceUrl: outputUrl,
    });

    return {
      data: {
        output_url: storedImage.url,
      },
    };
  } catch (error) {
    logger.error('Try-on generation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
