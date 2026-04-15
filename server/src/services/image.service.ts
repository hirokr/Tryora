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

export type GetUserTryOnImagesInput = {
  userId: string;
  page: number;
  limit: number;
  skip: number;
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
