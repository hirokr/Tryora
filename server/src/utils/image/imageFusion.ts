import { generateGeminiImage } from '#src/client/geminiImage.client.ts';
import logger from '#src/config/logger.ts';
import { storeGeneratedImageBytesToOwnedStorage } from '#src/services/imageStorage.service.ts';

interface TryOnRequest {
  personImagePath: string;
  garmentImagePaths: string[];
  category?: 'tops' | 'bottoms' | 'full_body';
  poser?: 'front' | 'side' | 'back';
}

interface TryOnResponse {
  data: {
    output_url: string;
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

const buildTryOnPrompt = (input: {
  category: NonNullable<TryOnRequest['category']>;
  poser: NonNullable<TryOnRequest['poser']>;
  clothingRefs: string[];
}) => {
  const clothingRefText = input.clothingRefs.join(', ');

  return [
    'Generate a realistic virtual try-on image.',
    'Use @Image1 as the person reference and keep identity, body proportions, and pose consistent.',
    `Use ${clothingRefText} as the clothing references and blend garments naturally on the person.`,
    `Pose guidance: ${categoryPoseMap[input.category]}, ${poserPoseMap[input.poser]}.`,
    'Use a minimalistic studio background and keep image quality commercial-grade.',
  ].join(' ');
};

export async function generateTryOnImage({
  personImagePath,
  garmentImagePaths,
  category = 'tops',
  poser = 'front',
}: TryOnRequest): Promise<TryOnResponse> {
  try {
    if (!garmentImagePaths.length) {
      throw new Error('At least one garment image path is required.');
    }

    const allImageUrls = [personImagePath, ...garmentImagePaths];
    const clothingRefs = garmentImagePaths.map(
      (_, index) => `@Image${index + 2}`
    );

    const generated = await generateGeminiImage({
      prompt: buildTryOnPrompt({
        category,
        poser,
        clothingRefs,
      }),
      imageUrls: allImageUrls,
      model:
        process.env.GEMINI_IMAGE_MODEL_TRYON?.trim() ||
        'gemini-3.1-flash-image-preview',
      requestLabel: 'Try-on generation',
    });

    const storedImage = await storeGeneratedImageBytesToOwnedStorage({
      bytes: generated.outputImageBytes,
      contentType: generated.outputMimeType,
      sourceLabel: 'tryon',
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
