import prisma from '#src/config/database.ts';
import logger from '#src/config/logger.ts';
import { JobStatus, JobType } from '#src/generated/enums.ts';
import { enqueueTryOnImageGenerationJob } from '#src/queues/imageFusion.queue.ts';
import type {
  Poser,
  TryOnCategory,
  TryOnImageGenerationJobData,
  TryOnImageGenerationQueueResponse,
} from '#src/types/tJob.js';
import { generateTryOnImage } from '#src/utils/image/imageFusion.ts';

const MAX_RETRIES = 3;

export type CreateTryOnImagesForProductsInput = {
  userId: string;
  productIds: string[];
  bodyImageId?: string;
  poseImageUrl?: string;
  poser?: Poser;
  category?: TryOnCategory;
};

export type TryOnImageItem = {
  tryonResultId: string;
  productId: string;
  imageUrl: string;
};

export type CreateTryOnImagesForProductsResult = {
  bodyImageId: string;
  images: TryOnImageItem[];
};

export type GetUserTryOnImagesInput = {
  userId: string;
  page: number;
  limit: number;
  skip: number;
};

export type GetUserTryOnImageByIdInput = {
  userId: string;
  tryonResultId: string;
};

export type UserTryOnImageListItem = {
  tryonResultId: string;
  bodyImageId: string;
  productId: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  isFavorite: boolean;
  isPublic: boolean;
  viewCount: number;
  glbUrl: string | null;
  createdAt: Date;
  product: {
    id: string;
    title: string;
    image: string;
    price: number | null;
    currency: string | null;
  } | null;
  bodyImage: {
    id: string;
    imageUrl: string;
    poseData: unknown;
    metadata: unknown;
  };
};

export type GetUserTryOnImagesResult = {
  images: UserTryOnImageListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type GetUserTryOnImageByIdResult = UserTryOnImageListItem;

export class ImageTryOnError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ImageTryOnError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

type BodyImageRecord = {
  id: string;
  imageUrl: string;
  poseData: unknown;
  metadata: unknown;
};

const DEFAULT_POSER: Poser = 'front';
const DEFAULT_CATEGORY: TryOnCategory = 'tops';

const normalizeProductIds = (productIds: string[]) => {
  const trimmed = productIds.map(id => id.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
};

const readPoser = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybePoser = (value as { poser?: unknown }).poser;
  return typeof maybePoser === 'string' ? maybePoser : null;
};

const findBodyImageByPoser = (images: BodyImageRecord[], poser: Poser) => {
  return images.find(image => {
    const poseFromPoseData = readPoser(image.poseData);
    if (poseFromPoseData === poser) {
      return true;
    }

    const poseFromMetadata = readPoser(image.metadata);
    return poseFromMetadata === poser;
  });
};

const createBodyImageFromDirectUrl = async (
  userId: string,
  poseImageUrl: string,
  poser: Poser
) => {
  return prisma.userBodyImage.create({
    data: {
      userId,
      imageUrl: poseImageUrl,
      poseData: { poser },
      metadata: { poser },
    },
    select: {
      id: true,
      imageUrl: true,
    },
  });
};

const resolveBodyImage = async (
  userId: string,
  bodyImageId: string | undefined,
  poseImageUrl: string | undefined,
  poser: Poser
) => {
  if (bodyImageId) {
    const existingBodyImage = await prisma.userBodyImage.findFirst({
      where: {
        id: bodyImageId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!existingBodyImage) {
      throw new ImageTryOnError('Body image not found', 404);
    }

    return existingBodyImage;
  }

  if (poseImageUrl) {
    return createBodyImageFromDirectUrl(userId, poseImageUrl, poser);
  }

  const existingImages = await prisma.userBodyImage.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      imageUrl: true,
      poseData: true,
      metadata: true,
    },
  });

  if (existingImages.length === 0) {
    throw new ImageTryOnError(
      'No body image found. Send poseImageUrl or upload a body image first.',
      400
    );
  }

  const posedImage = findBodyImageByPoser(existingImages, poser);
  return posedImage || existingImages[0];
};

const getProductsForTryOn = async (productIds: string[]) => {
  const normalizedProductIds = normalizeProductIds(productIds);

  if (normalizedProductIds.length === 0) {
    throw new ImageTryOnError('At least one product id is required', 400);
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: normalizedProductIds,
      },
    },
    select: {
      id: true,
      image: true,
    },
  });

  const foundProductIds = new Set(products.map(product => product.id));
  const missingProductIds = normalizedProductIds.filter(
    id => !foundProductIds.has(id)
  );

  if (missingProductIds.length) {
    throw new ImageTryOnError('Some products were not found', 404, {
      missingProductIds,
    });
  }

  return products;
};

const createTryOnResultRecord = async (
  userId: string,
  bodyImageId: string,
  productId: string,
  imageUrl: string,
  category: TryOnCategory,
  poser: Poser,
  generationJobId?: string
) => {
  return prisma.tryonResult.create({
    data: {
      userId,
      bodyImageId,
      productId,
      ...(generationJobId ? { jobId: generationJobId } : {}),
      resultImageUrl: imageUrl,
      generationParams: {
        category,
        poser,
        productId,
      },
      modelVersion:
        process.env.GEMINI_IMAGE_MODEL_TRYON?.trim() ||
        'gemini-3.1-flash-image-preview',
    },
    select: {
      id: true,
      productId: true,
      resultImageUrl: true,
    },
  });
};

export const createTryOnImagesForProducts = async (
  input: CreateTryOnImagesForProductsInput,
  generationJobId?: string
): Promise<CreateTryOnImagesForProductsResult> => {
  const poser = input.poser || DEFAULT_POSER;
  const category = input.category || DEFAULT_CATEGORY;

  const bodyImage = await resolveBodyImage(
    input.userId,
    input.bodyImageId,
    input.poseImageUrl,
    poser
  );

  const products = await getProductsForTryOn(input.productIds);
  const primaryProduct = products[0];

  const generated = await generateTryOnImage({
    personImagePath: bodyImage.imageUrl,
    garmentImagePaths: products.map(product => product.image),
    category,
    poser,
  });

  const tryOnResult = await createTryOnResultRecord(
    input.userId,
    bodyImage.id,
    primaryProduct.id,
    generated.data.output_url,
    category,
    poser,
    generationJobId
  );

  const images: TryOnImageItem[] = [
    {
      tryonResultId: tryOnResult.id,
      productId: tryOnResult.productId || primaryProduct.id,
      imageUrl: tryOnResult.resultImageUrl,
    },
  ];

  logger.info(
    `[TryOn] Generated ${images.length} try-on image(s) for user ${input.userId}`
  );

  return {
    bodyImageId: bodyImage.id,
    images,
  };
};

export const createTryOnImageGenerationJob = async (
  input: CreateTryOnImagesForProductsInput
): Promise<TryOnImageGenerationQueueResponse> => {
  const poser = input.poser || DEFAULT_POSER;
  const category = input.category || DEFAULT_CATEGORY;

  const bodyImage = await resolveBodyImage(
    input.userId,
    input.bodyImageId,
    input.poseImageUrl,
    poser
  );

  const products = await getProductsForTryOn(input.productIds);

  const generationJob = await prisma.generationJob.create({
    data: {
      userId: input.userId,
      jobType: JobType.TRYON_GENERATION,
      status: JobStatus.QUEUED,
      inputData: {
        source: 'TRYON_IMAGE',
        bodyImageId: bodyImage.id,
        productIds: products.map(product => product.id),
        poser,
        category,
      },
      maxRetries: MAX_RETRIES,
    },
  });

  try {
    await enqueueTryOnImageGenerationJob(
      {
        generationJobId: generationJob.id,
        userId: input.userId,
        bodyImageId: bodyImage.id,
        productIds: products.map(product => product.id),
        poser,
        category,
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

    throw new ImageTryOnError('Failed to enqueue try-on image job', 500);
  }

  return {
    jobId: generationJob.id,
    status: generationJob.status,
  };
};

export const markTryOnGenerationJobAsProcessing = async (
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

export const updateTryOnGenerationJobProgress = async (
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

export const completeTryOnGenerationJob = async (
  generationJobId: string,
  result: CreateTryOnImagesForProductsResult
) => {
  const firstImage = result.images[0];

  await prisma.generationJob.update({
    where: { id: generationJobId },
    data: {
      status: JobStatus.COMPLETED,
      progress: 100,
      currentStage: 'done',
      completedAt: new Date(),
      outputImageUrl: firstImage?.imageUrl || null,
      resultData: {
        source: 'TRYON_IMAGE',
        bodyImageId: result.bodyImageId,
        tryonResultId: firstImage?.tryonResultId || null,
        productId: firstImage?.productId || null,
        imageUrl: firstImage?.imageUrl || null,
      },
    },
  });
};

export const markTryOnGenerationJobFailedState = async (
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

export const processQueuedTryOnImageGenerationJob = async (
  input: TryOnImageGenerationJobData
) => {
  await updateTryOnGenerationJobProgress(
    input.generationJobId,
    30,
    'calling_gemini'
  );

  const result = await createTryOnImagesForProducts(
    {
      userId: input.userId,
      productIds: input.productIds,
      bodyImageId: input.bodyImageId,
      poser: input.poser,
      category: input.category,
    },
    input.generationJobId
  );

  await updateTryOnGenerationJobProgress(
    input.generationJobId,
    90,
    'persisting_result'
  );

  await completeTryOnGenerationJob(input.generationJobId, result);

  return result;
};

export const getUserTryOnImages = async (
  input: GetUserTryOnImagesInput
): Promise<GetUserTryOnImagesResult> => {
  const whereClause = {
    userId: input.userId,
    deletedAt: null,
  };

  const [totalItems, tryOnResults] = await prisma.$transaction([
    prisma.tryonResult.count({
      where: whereClause,
    }),
    prisma.tryonResult.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip: input.skip,
      take: input.limit,
      select: {
        id: true,
        bodyImageId: true,
        productId: true,
        resultImageUrl: true,
        thumbnailUrl: true,
        isFavorite: true,
        isPublic: true,
        viewCount: true,
        glbUrl: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            image: true,
            price: true,
            currency: true,
          },
        },
        bodyImage: {
          select: {
            id: true,
            imageUrl: true,
            poseData: true,
            metadata: true,
          },
        },
      },
    }),
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / input.limit);

  return {
    images: tryOnResults.map(tryOnResult => ({
      tryonResultId: tryOnResult.id,
      bodyImageId: tryOnResult.bodyImageId,
      productId: tryOnResult.productId,
      imageUrl: tryOnResult.resultImageUrl,
      thumbnailUrl: tryOnResult.thumbnailUrl,
      isFavorite: tryOnResult.isFavorite,
      isPublic: tryOnResult.isPublic,
      viewCount: tryOnResult.viewCount,
      glbUrl: tryOnResult.glbUrl,
      createdAt: tryOnResult.createdAt,
      product: tryOnResult.product,
      bodyImage: tryOnResult.bodyImage,
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      totalItems,
      totalPages,
      hasNextPage: input.page < totalPages,
      hasPreviousPage: input.page > 1 && totalItems > 0,
    },
  };
};

export const getUserTryOnImageById = async (
  input: GetUserTryOnImageByIdInput
): Promise<GetUserTryOnImageByIdResult> => {
  const tryOnResult = await prisma.tryonResult.findFirst({
    where: {
      id: input.tryonResultId,
      userId: input.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      bodyImageId: true,
      productId: true,
      resultImageUrl: true,
      thumbnailUrl: true,
      isFavorite: true,
      isPublic: true,
      viewCount: true,
      glbUrl: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          title: true,
          image: true,
          price: true,
          currency: true,
        },
      },
      bodyImage: {
        select: {
          id: true,
          imageUrl: true,
          poseData: true,
          metadata: true,
        },
      },
    },
  });

  if (!tryOnResult) {
    throw new ImageTryOnError('Try-on image not found', 404);
  }

  return {
    tryonResultId: tryOnResult.id,
    bodyImageId: tryOnResult.bodyImageId,
    productId: tryOnResult.productId,
    imageUrl: tryOnResult.resultImageUrl,
    thumbnailUrl: tryOnResult.thumbnailUrl,
    isFavorite: tryOnResult.isFavorite,
    isPublic: tryOnResult.isPublic,
    viewCount: tryOnResult.viewCount,
    glbUrl: tryOnResult.glbUrl,
    createdAt: tryOnResult.createdAt,
    product: tryOnResult.product,
    bodyImage: tryOnResult.bodyImage,
  };
};
