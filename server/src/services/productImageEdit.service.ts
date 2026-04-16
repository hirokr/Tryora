import prisma from '#src/config/database.ts';
import logger from '#src/config/logger.ts';
import { JobStatus, JobType } from '#src/generated/enums.ts';
import { enqueueProductImageEditJob } from '#src/queues/productImageEdit.queue.ts';
import { mirrorGeneratedImageToOwnedStorage } from '#src/services/imageStorage.service.ts';
import {
  ProductAppearanceEditInput,
  ProductAppearanceEditResult,
  UpdatedProductForAppearanceEdit,
} from '#src/types/productImageEdit.js';
import {
  ProductImageEditJobData,
  ProductImageEditQueueResponse,
} from '#src/types/productImageEditJob.js';
import { editProductImageWithAi } from '#src/utils/image/productAppearanceEdit.ts';
import { buildProductAppearancePrompt } from '#src/utils/productAppearancePrompt.ts';

const DEFAULT_EDIT_MODEL = 'v2';
const DEFAULT_INFERENCE_STEPS = 30;
const DEFAULT_GUIDANCE_SCALE = 7;
const DEFAULT_FORMAT: 'png' = 'png';
const CLAID_MAX_INPUT_LENGTH = 4096;
const MAX_RETRIES = 3;

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

const isWithinClaidInputLimit = (value: string) =>
  value.length <= CLAID_MAX_INPUT_LENGTH;

const resolveAiEditInputImage = async (input: {
  image: string;
  processedImageUrl: string | null;
  productId: string;
}) => {
  const directCandidates = [input.processedImageUrl, input.image].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );

  const directCandidate = directCandidates.find(isWithinClaidInputLimit);
  if (directCandidate) {
    return directCandidate;
  }

  const sourceToMirror = directCandidates[0];
  if (!sourceToMirror) {
    throw new ProductImageEditError('Product image source is missing', 400);
  }

  logger.info('[Product Ai Edit] Input image exceeds CLAID limit, mirroring', {
    productId: input.productId,
  });

  const mirroredInput = await mirrorGeneratedImageToOwnedStorage({
    sourceUrl: sourceToMirror,
  });

  if (!isWithinClaidInputLimit(mirroredInput.url)) {
    throw new ProductImageEditError(
      'Source product image is too long for AI edit provider input limit',
      502
    );
  }

  return mirroredInput.url;
};

export const createProductAppearanceEditJob = async (
  userId: string,
  productId: string,
  input: ProductAppearanceEditInput
): Promise<ProductImageEditQueueResponse> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new ProductImageEditError('Product not found', 404);
  }

  const generationJob = await prisma.generationJob.create({
    data: {
      userId,
      jobType: JobType.TRYON_GENERATION,
      status: JobStatus.QUEUED,
      inputData: {
        source: 'PRODUCT_IMAGE_EDIT',
        productId,
        input,
      },
      maxRetries: MAX_RETRIES,
    },
  });

  try {
    await enqueueProductImageEditJob(
      {
        generationJobId: generationJob.id,
        userId,
        productId,
        input,
      },
      generationJob.maxRetries
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.generationJob.update({
      where: { id: generationJob.id },
      data: {
        status: JobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: `Failed to enqueue BullMQ job: ${message}`,
      },
    });

    throw new ProductImageEditError(
      'Failed to enqueue product image edit job',
      500
    );
  }

  return {
    jobId: generationJob.id,
    status: generationJob.status,
  };
};

export const markProductImageEditJobAsProcessing = async (
  generationJobId: string,
  retryCount: number
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      status: JobStatus.PROCESSING,
      startedAt: new Date(),
      currentStage: 'generating',
      progress: 10,
      retryCount,
      errorMessage: null,
    },
  });
};

export const updateProductImageEditJobProgress = async (
  generationJobId: string,
  progress: number,
  currentStage: string
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      progress,
      currentStage,
    },
  });
};

export const completeProductImageEditJob = async (
  generationJobId: string,
  result: ProductAppearanceEditResult
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      status: JobStatus.COMPLETED,
      progress: 100,
      currentStage: 'done',
      completedAt: new Date(),
      outputImageUrl: result.defaultImageUrl,
      resultData: {
        source: 'PRODUCT_IMAGE_EDIT',
        productId: result.product.id,
        imageUrl: result.defaultImageUrl,
      },
    },
  });
};

export const markProductImageEditJobFailedState = async (
  generationJobId: string,
  hasRetryLeft: boolean,
  retryCount: number,
  errorMessage: string
) => {
  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      status: hasRetryLeft ? JobStatus.QUEUED : JobStatus.FAILED,
      retryCount,
      errorMessage,
      completedAt: hasRetryLeft ? null : new Date(),
      currentStage: hasRetryLeft ? 'retrying' : 'failed',
    },
  });
};

export const processQueuedProductImageEditJob = async (
  input: ProductImageEditJobData
) => {
  await updateProductImageEditJobProgress(
    input.generationJobId,
    40,
    'updating_product'
  );

  const result = await editProductAppearanceAndSaveImage(
    input.productId,
    input.input
  );

  await completeProductImageEditJob(input.generationJobId, result);

  return result;
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
      processedImageUrl: true,
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

  const aiInputImage = await resolveAiEditInputImage({
    image: product.image,
    processedImageUrl: product.processedImageUrl,
    productId,
  });

  let editedExternalImageUrl: string;

  try {
    const aiEdited = await editProductImageWithAi({
      inputImage: aiInputImage,
      prompt,
      model: input.model || DEFAULT_EDIT_MODEL,
      aspectRatio: input.aspectRatio,
      inferenceSteps: input.inferenceSteps || DEFAULT_INFERENCE_STEPS,
      guidanceScale: input.guidanceScale || DEFAULT_GUIDANCE_SCALE,
      format: input.format || DEFAULT_FORMAT,
    });

    editedExternalImageUrl = aiEdited.outputUrl;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const isRateLimitFailure =
      reason.includes('status 429') ||
      reason.toLowerCase().includes('too many requests') ||
      reason.toLowerCase().includes('rate limit');

    throw new ProductImageEditError(
      'Failed to generate edited product image',
      isRateLimitFailure ? 503 : 502,
      reason
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
