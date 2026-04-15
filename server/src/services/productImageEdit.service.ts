import prisma from '#src/config/database.ts';
import logger from '#src/config/logger.ts';
import { mirrorGeneratedImageToOwnedStorage } from '#src/services/imageStorage.service.ts';
import {
  ProductAppearanceEditInput,
  ProductAppearanceEditResult,
  UpdatedProductForAppearanceEdit,
} from '#src/types/productImageEdit.js';
import { editProductImageWithAi } from '#src/utils/image/productAppearanceEdit.ts';
import { buildProductAppearancePrompt } from '#src/utils/productAppearancePrompt.ts';

const DEFAULT_EDIT_MODEL = 'v2';
const DEFAULT_ASPECT_RATIO = '1:1';
const DEFAULT_INFERENCE_STEPS = 30;
const DEFAULT_GUIDANCE_SCALE = 7;
const DEFAULT_FORMAT: 'png' = 'png';

export class ProductImageEditError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ProductImageEditError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const normalizeTag = (value: string) => value.trim().toLowerCase();

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const mergeTags = (existingValue: unknown, newTag: string) => {
  const normalizedNewTag = normalizeTag(newTag);
  const merged = new Set<string>();

  for (const tag of toStringArray(existingValue)) {
    merged.add(normalizeTag(tag));
  }

  merged.add(normalizedNewTag);

  return Array.from(merged);
};

const toProductResponse = (product: {
  id: string;
  title: string;
  image: string;
  productUrl: string | null;
  price: number | null;
  currency: string | null;
  category: string | null;
  colorTags: unknown;
  patternTags: unknown;
  processedImageUrl: string | null;
  images: Array<{
    id: string;
    url: string;
  }>;
}): UpdatedProductForAppearanceEdit => {
  return {
    id: product.id,
    title: product.title,
    image: product.image,
    productUrl: product.productUrl,
    price: product.price,
    currency: product.currency,
    category: product.category,
    colorTags: product.colorTags,
    patternTags: product.patternTags,
    processedImageUrl: product.processedImageUrl,
    images: product.images,
  };
};

export const editProductAppearanceAndSaveImage = async (
  productId: string,
  input: ProductAppearanceEditInput
): Promise<ProductAppearanceEditResult> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      image: true,
      colorTags: true,
      patternTags: true,
    },
  });

  if (!product) {
    throw new ProductImageEditError('Product not found', 404);
  }

  const prompt = buildProductAppearancePrompt({
    productTitle: product.title,
    color: input.color,
    pattern: input.pattern,
    customPrompt: input.prompt,
  });

  let editedExternalImageUrl: string;

  try {
    const aiEdited = await editProductImageWithAi({
      inputImage: product.image,
      prompt,
      model: input.model || DEFAULT_EDIT_MODEL,
      aspectRatio: input.aspectRatio || DEFAULT_ASPECT_RATIO,
      inferenceSteps: input.inferenceSteps || DEFAULT_INFERENCE_STEPS,
      guidanceScale: input.guidanceScale || DEFAULT_GUIDANCE_SCALE,
      format: input.format || DEFAULT_FORMAT,
    });

    editedExternalImageUrl = aiEdited.outputUrl;
  } catch (error) {
    throw new ProductImageEditError(
      'Failed to generate edited product image',
      502,
      error instanceof Error ? error.message : String(error)
    );
  }

  const mirroredImage = await mirrorGeneratedImageToOwnedStorage({
    sourceUrl: editedExternalImageUrl,
  });

  const nextColorTags = mergeTags(product.colorTags, input.color);
  const nextPatternTags = input.pattern
    ? mergeTags(product.patternTags, input.pattern)
    : undefined;

  const updateData: {
    image: string;
    processedImageUrl: string;
    colorTags: string[];
    patternTags?: string[];
  } = {
    image: mirroredImage.url,
    processedImageUrl: mirroredImage.url,
    colorTags: nextColorTags,
  };

  if (nextPatternTags) {
    updateData.patternTags = nextPatternTags;
  }

  const updatedProduct = await prisma.$transaction(async tx => {
    await tx.productImage.create({
      data: {
        productId,
        url: mirroredImage.url,
      },
    });

    return tx.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        title: true,
        image: true,
        productUrl: true,
        price: true,
        currency: true,
        category: true,
        colorTags: true,
        patternTags: true,
        processedImageUrl: true,
        images: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });
  });

  logger.info('[Product Ai Edit] Product image updated successfully', {
    productId,
    defaultImageUrl: mirroredImage.url,
  });

  return {
    message: 'Product image updated successfully',
    defaultImageUrl: mirroredImage.url,
    product: toProductResponse(updatedProduct),
  };
};
