import logger from '#src/config/logger.ts';
import {
  GeminiImagePollingUpdate,
  generateGeminiImage,
} from '#src/client/geminiImage.client.ts';
import { storeGeneratedImageBytesToOwnedStorage } from '#src/services/imageStorage.service.ts';
import {
  ProductAppearanceEditApiRequest,
  ProductAppearanceEditApiResult,
} from '#src/types/productImageEdit.js';

export type ProductAppearanceEditAiHooks = {
  onRequestAccepted?: (requestId: string) => Promise<void> | void;
  onPollingUpdate?: (update: GeminiImagePollingUpdate) => Promise<void> | void;
};

const GEMINI_MODEL_MAP: Record<'v1' | 'v2', string> = {
  v1: process.env.GEMINI_IMAGE_MODEL_V1?.trim() || 'gemini-2.5-flash-image',
  v2:
    process.env.GEMINI_IMAGE_MODEL_V2?.trim() ||
    'gemini-3.1-flash-image-preview',
};

const buildGeminiEditPrompt = (input: ProductAppearanceEditApiRequest) => {
  const lines = [
    input.prompt,
    'Use @Image1 as the source product image.',
    'Preserve the product identity and keep the item photorealistic.',
  ];

  if (input.model === 'v1') {
    lines.push('Use conservative edits and keep shape details stable.');
  }

  return lines.join('\n');
};

export const editProductImageWithAi = async (
  input: ProductAppearanceEditApiRequest,
  hooks?: ProductAppearanceEditAiHooks
): Promise<ProductAppearanceEditApiResult> => {
  if (!input.inputImage) {
    throw new Error('Input image URL is required for AI edit.');
  }

  try {
    logger.info('[Product Ai Edit] Calling Gemini image API', {
      model: input.model,
      format: input.format,
      hasAspectRatio: Boolean(input.aspectRatio),
    });

    const result = await generateGeminiImage({
      prompt: buildGeminiEditPrompt(input),
      imageUrls: [input.inputImage],
      model: GEMINI_MODEL_MAP[input.model],
      aspectRatio: input.aspectRatio,
      imageSize:
        input.model === 'v2'
          ? (process.env.GEMINI_IMAGE_EDIT_SIZE?.trim() as
              | '512'
              | '1K'
              | '2K'
              | '4K'
              | undefined) || '1K'
          : undefined,
      requestLabel: 'Product Ai Edit',
      onRequestAccepted: hooks?.onRequestAccepted,
      onPollingUpdate: hooks?.onPollingUpdate,
    });

    const storedImage = await storeGeneratedImageBytesToOwnedStorage({
      bytes: result.outputImageBytes,
      contentType: result.outputMimeType,
      sourceLabel: 'product-ai-edit',
    });

    return { outputUrl: storedImage.url };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Product ai-edit failed: ${reason}`);
  }
};
