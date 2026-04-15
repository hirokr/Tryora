import prisma from '#src/config/database.ts';
import logger from '#src/config/logger.ts';
import { generateTryOnImage } from '#src/utils/image/imageFusion.ts';

type TryOnCategory = 'tops' | 'bottoms' | 'full_body';
type Poser = 'front' | 'side' | 'back';

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
  poser: Poser
) => {
  return prisma.tryonResult.create({
    data: {
      userId,
      bodyImageId,
      productId,
      resultImageUrl: imageUrl,
      generationParams: {
        category,
        poser,
        productId,
      },
      modelVersion: 'claid-ai-fashion-models',
    },
    select: {
      id: true,
      productId: true,
      resultImageUrl: true,
    },
  });
};

export const createTryOnImagesForProducts = async (
  input: CreateTryOnImagesForProductsInput
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
    poser
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
