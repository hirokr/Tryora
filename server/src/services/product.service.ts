import prisma from '#src/config/database.ts';
import { Gender } from '#src/generated/enums.ts';
import { ProductMetricAction } from '#src/types/product.js';
import { calculateTrendingScore } from '#src/utils/search.ts';

const PRODUCT_LIST_SELECT = {
  id: true,
  title: true,
  source: true,
  defaultImageUrl: true,
  price: true,
  viewCount: true,
  likeCount: true,
} as const;

const PRODUCT_DETAILS_SELECT = {
  id: true,
  title: true,
  source: true,
  defaultImageUrl: true,
  googlelink: true,
  price: true,
  rating: true,
  ratingCount: true,
  viewCount: true,
  likeCount: true,
  variants: {
    select: {
      imageUrl: true,
      variantData: true,
    },
  },
} as const;

const RECOMMENDATION_CANDIDATE_SELECT = {
  id: true,
  title: true,
  source: true,
  defaultImageUrl: true,
  price: true,
  viewCount: true,
  likeCount: true,
  orderCount: true,
  trendingScore: true,
  preferedGender: true,
  ageRange: true,
  culturalTags: true,
  extarnalTags: true,
  location: true,
  category: true,
} as const;

type ProductFilterInput = {
  minPrice?: number;
  maxPrice?: number;
  source?: string;
  catogory?: string;
  subCatogory?: string;
  brand?: string;
  title?: string;
  color?: string;
};

const normalizeText = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase();

const parseAgeRange = (
  ageRange: string | null | undefined
): { min?: number; max?: number } | null => {
  if (!ageRange) {
    return null;
  }

  const normalized = normalizeText(ageRange);
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const plusMatch = normalized.match(/^(\d+)\s*\+$/);
  if (plusMatch) {
    return {
      min: Number(plusMatch[1]),
    };
  }

  const underMatch = normalized.match(/^under\s*(\d+)$/);
  if (underMatch) {
    return {
      max: Number(underMatch[1]),
    };
  }

  return null;
};

const isAgeMatch = (userAge: number | null, ageRange: string | null) => {
  if (userAge === null || ageRange === null) {
    return false;
  }

  const parsed = parseAgeRange(ageRange);
  if (!parsed) {
    return false;
  }

  if (parsed.min !== undefined && userAge < parsed.min) {
    return false;
  }

  if (parsed.max !== undefined && userAge > parsed.max) {
    return false;
  }

  return true;
};

const getTagOverlapScore = (userInterests: string[], productTags: string[]) => {
  if (!userInterests.length || !productTags.length) {
    return 0;
  }

  const normalizedInterests = new Set(userInterests.map(normalizeText));
  const overlapCount = productTags.reduce((count, tag) => {
    if (normalizedInterests.has(normalizeText(tag))) {
      return count + 1;
    }

    return count;
  }, 0);

  return Math.min(overlapCount * 1.15, 3.45);
};

const parseNumericPrice = (price: string | null | undefined) => {
  if (!price) {
    return null;
  }

  const numericText = price.replace(/[^\d.]/g, '');
  const numericPrice = Number.parseFloat(numericText);

  return Number.isFinite(numericPrice) ? numericPrice : null;
};

const buildRecommendationScore = (params: {
  userAge: number | null;
  userGender: (typeof Gender)[keyof typeof Gender];
  userInterests: string[];
  userLocation: string | null;
  product: {
    title: string;
    category: string | null;
    location: string | null;
    preferedGender: (typeof Gender)[keyof typeof Gender];
    ageRange: string | null;
    culturalTags: string[];
    extarnalTags: string[];
    likeCount: number;
    viewCount: number;
    orderCount: number;
    trendingScore: number;
  };
}) => {
  const { userAge, userGender, userInterests, userLocation, product } = params;

  let score = Math.max(product.trendingScore ?? 0, 0);

  if (
    product.preferedGender === Gender.UNISEX ||
    product.preferedGender === userGender
  ) {
    score += 2;
  } else {
    score -= 1;
  }

  if (isAgeMatch(userAge, product.ageRange)) {
    score += 1.5;
  }

  const tagScore = getTagOverlapScore(userInterests, [
    ...product.culturalTags,
    ...product.extarnalTags,
    product.category ?? '',
    product.title,
  ]);
  score += tagScore;

  if (
    userLocation &&
    product.location &&
    normalizeText(userLocation) === normalizeText(product.location)
  ) {
    score += 1.25;
  }

  const engagementScore = Math.log1p(
    product.likeCount * 3 + product.viewCount + product.orderCount * 5
  );
  score += engagementScore / 2;

  return Number(score.toFixed(6));
};

export const findProductById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
  });
};

export const getProductsService = async (
  limit: number = 20,
  skip: number = 0
) => {
  return prisma.product.findMany({
    take: limit,
    skip: skip,
    orderBy: { createdAt: 'desc' },
    select: PRODUCT_LIST_SELECT,
  });
};

export const getProductDetailsById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
    select: PRODUCT_DETAILS_SELECT,
  });
};

export const findVariantById = async (variantId: string) => {
  return prisma.productVariant.findUnique({
    where: { id: variantId },
  });
};

export const addProductVariant = async (
  productId: string,
  imageUrl: string,
  variantData: string
) => {
  return prisma.productVariant.create({
    data: {
      productId,
      imageUrl,
      variantData,
    },
  });
};

export const getTopTrending = async (limit: number = 20, skip: number = 0) => {
  return prisma.product.findMany({
    orderBy: {
      trendingScore: 'desc',
    },
    take: limit,
    skip: skip,
    select: PRODUCT_LIST_SELECT,
  });
};

export const getProductsBySearchID = async (searchId: string) => {
  return prisma.product.findMany({ where: { searchId } });
};

export const getProductsByIds = async (productIds: string[]) => {
  if (!productIds.length) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });
};

export const getProductById = async (productId: string) => {
  return prisma.product.findUnique({ where: { id: productId } });
};

export const getProductsByfilters = async (filters: ProductFilterInput) => {
  const where: any = {};

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.catogory) {
    where.category = filters.catogory;
  }

  if (filters.title) {
    where.title = {
      contains: filters.title,
      mode: 'insensitive',
    };
  }

  const tagFilters = [filters.subCatogory, filters.brand, filters.color].filter(
    Boolean
  ) as string[];
  if (tagFilters.length) {
    where.extarnalTags = { hasSome: tagFilters };
  }

  const products = await prisma.product.findMany({ where });

  const hasPriceFilter =
    filters.minPrice !== undefined || filters.maxPrice !== undefined;
  if (!hasPriceFilter) {
    return products;
  }

  return products.filter(product => {
    const numericPrice = parseNumericPrice(product.price);
    if (numericPrice === null) {
      return false;
    }

    if (filters.minPrice !== undefined && numericPrice < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== undefined && numericPrice > filters.maxPrice) {
      return false;
    }

    return true;
  });
};

export const updateTrendingScore = async (
  productId: string,
  action: ProductMetricAction
) => {
  return prisma.$transaction(async tx => {
    const updatedMetrics = await tx.product.update({
      where: { id: productId },
      data: {
        viewCount: action === 'VIEW' ? { increment: 1 } : undefined,
        likeCount:
          action === 'CLICK' || action === 'LIKE'
            ? { increment: 1 }
            : undefined,
      },
      select: {
        id: true,
        likeCount: true,
        viewCount: true,
        orderCount: true,
      },
    });

    const score = calculateTrendingScore(
      updatedMetrics.likeCount ?? 0,
      updatedMetrics.viewCount ?? 0,
      updatedMetrics.orderCount ?? 0
    );

    return tx.product.update({
      where: { id: productId },
      data: { trendingScore: score },
    });
  });
};

export const getRuntimeRecommendations = async (params: {
  userId: string;
  limit?: number;
  skip?: number;
  category?: string;
}) => {
  const safeLimit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const safeSkip = Math.max(params.skip ?? 0, 0);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      age: true,
      gender: true,
      interests: true,
      location: true,
    },
  });

  if (!user) {
    return [];
  }

  const candidateWindow = Math.min(
    500,
    Math.max((safeLimit + safeSkip) * 6, 60)
  );

  const candidates = await prisma.product.findMany({
    where: {
      category: params.category,
    },
    orderBy: [{ trendingScore: 'desc' }, { updatedAt: 'desc' }],
    take: candidateWindow,
    select: RECOMMENDATION_CANDIDATE_SELECT,
  });

  const rankedProducts = candidates
    .map(product => ({
      id: product.id,
      title: product.title,
      source: product.source,
      defaultImageUrl: product.defaultImageUrl,
      price: product.price,
      viewCount: product.viewCount,
      likeCount: product.likeCount,
      recommendationScore: buildRecommendationScore({
        userAge: user.age,
        userGender: user.gender,
        userInterests: user.interests,
        userLocation: user.location,
        product,
      }),
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  return rankedProducts.slice(safeSkip, safeSkip + safeLimit);
};
