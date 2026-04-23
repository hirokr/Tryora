// 1
import prisma from '#src/config/database.ts';
import type { Prisma } from '#src/generated/client.ts';
import { Gender } from '#src/generated/enums.ts';
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
  minPrice?: number | string;
  maxPrice?: number | string;
  source?: string;
  category?: string;
  subCategory?: string;

  // Backward compatibility for existing API clients.
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

const parseFilterPrice = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const parsed = Number.parseFloat(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toSearchTermList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => normalizeText(item))
    .filter(Boolean);
};

const toSearchTerm = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeText(value);
  return normalized || null;
};

const tokenizePrompt = (prompt: string) => {
  return normalizeText(prompt)
    .split(/[^a-z0-9]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 3);
};

const getKeywordOverlapCount = (title: string, keywords: Set<string>) => {
  if (!keywords.size) {
    return 0;
  }

  const titleTokens = new Set(tokenizePrompt(title));
  let overlap = 0;

  for (const token of titleTokens) {
    if (keywords.has(token)) {
      overlap += 1;
    }
  }

  return overlap;
};

const buildSearchPreferenceProfile = (
  searches: {
    prompt: string;
    parsedParams: Prisma.JsonValue | null;
  }[]
) => {
  const recentSearches = searches.slice(0, 20);
  const categoryWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const keywordWeights = new Map<string, number>();

  recentSearches.forEach((search, index) => {
    const recencyWeight = Math.max(1, recentSearches.length - index);

    for (const token of tokenizePrompt(search.prompt)) {
      keywordWeights.set(
        token,
        (keywordWeights.get(token) ?? 0) + recencyWeight * 0.08
      );
    }

    if (!search.parsedParams || typeof search.parsedParams !== 'object') {
      return;
    }

    const parsed = search.parsedParams as Record<string, unknown>;
    const parsedCategory = toSearchTerm(parsed.category);
    if (parsedCategory) {
      categoryWeights.set(
        parsedCategory,
        (categoryWeights.get(parsedCategory) ?? 0) + recencyWeight
      );
    }

    const parsedTags = toSearchTermList(parsed.culturalTags);
    for (const tag of parsedTags) {
      tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + recencyWeight * 0.75);
    }

    const parsedProduct = toSearchTerm(parsed.product);
    if (parsedProduct) {
      keywordWeights.set(
        parsedProduct,
        (keywordWeights.get(parsedProduct) ?? 0) + recencyWeight * 0.35
      );
    }

    const parsedStyle = toSearchTerm(parsed.style);
    if (parsedStyle) {
      keywordWeights.set(
        parsedStyle,
        (keywordWeights.get(parsedStyle) ?? 0) + recencyWeight * 0.25
      );
    }

    const parsedOccasion = toSearchTerm(parsed.occasion);
    if (parsedOccasion) {
      keywordWeights.set(
        parsedOccasion,
        (keywordWeights.get(parsedOccasion) ?? 0) + recencyWeight * 0.22
      );
    }
  });

  return {
    categoryWeights,
    tagWeights,
    keywords: new Set(
      [...keywordWeights.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([keyword]) => keyword)
    ),
  };
};

const buildSearchHistoryScore = (params: {
  profile: ReturnType<typeof buildSearchPreferenceProfile>;
  product: {
    title: string;
    category: string | null;
    culturalTags: string[];
    extarnalTags: string[];
  };
}) => {
  const { profile, product } = params;
  let score = 0;

  const normalizedCategory = product.category
    ? normalizeText(product.category)
    : null;
  if (normalizedCategory) {
    const categoryWeight = profile.categoryWeights.get(normalizedCategory) ?? 0;
    score += Math.min(categoryWeight * 0.14, 2.1);
  }

  const productTags = [...product.culturalTags, ...product.extarnalTags].map(
    normalizeText
  );

  for (const tag of productTags) {
    const tagWeight = profile.tagWeights.get(tag) ?? 0;
    if (tagWeight > 0) {
      score += Math.min(tagWeight * 0.07, 0.7);
    }
  }

  const keywordOverlapCount = getKeywordOverlapCount(
    product.title,
    profile.keywords
  );
  score += Math.min(keywordOverlapCount * 0.3, 1.2);

  return Number(score.toFixed(6));
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
  return prisma.product.update({
    where: { id: productId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
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
  return prisma.product.findMany({
    where: { searchId },
    select: {
      search: true,
      id: true,
      title: true,
      source: true,
      defaultImageUrl: true,
      price: true,
      rating: true,
      ratingCount: true,
      viewCount: true,
      likeCount: true,
      variants: {
        select: {
          id: true,
          imageUrl: true,
          variantData: true,
        },
      },
    },
  });
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

export const getProductsByfilters = async (
  filters: ProductFilterInput,
  limit: number,
  skip: number
) => {
  const where: Prisma.ProductWhereInput = {};

  const source = filters.source?.trim();
  const category = (filters.category ?? filters.catogory)?.trim();
  const subCategory = (filters.subCategory ?? filters.subCatogory)?.trim();
  const title = filters.title?.trim();

  const minPrice = parseFilterPrice(filters.minPrice);
  const maxPrice = parseFilterPrice(filters.maxPrice);

  if (source) {
    where.source = {
      contains: source,
      mode: 'insensitive',
    };
  }

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive',
    };
  }

  if (title) {
    where.title = {
      contains: title,
      mode: 'insensitive',
    };
  }

  const tagFilters = [subCategory, filters.brand?.trim(), filters.color?.trim()]
    .filter((value): value is string => Boolean(value))
    .map(normalizeText);

  const products = await prisma.product.findMany({
    where,
    take: limit,
    skip: skip,
    orderBy: { createdAt: 'desc' },
  });

  const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;
  const hasTagFilter = tagFilters.length > 0;

  if (!hasPriceFilter && !hasTagFilter) {
    return products;
  }

  return products.filter(product => {
    if (hasTagFilter) {
      const normalizedTags = [
        ...product.extarnalTags,
        ...product.culturalTags,
      ].map(normalizeText);
      const hasTagMatch = tagFilters.some(tag => normalizedTags.includes(tag));

      if (!hasTagMatch) {
        return false;
      }
    }

    const numericPrice = parseNumericPrice(product.price);

    if (!hasPriceFilter) {
      return true;
    }

    if (numericPrice === null) {
      return false;
    }

    if (minPrice !== undefined && numericPrice < minPrice) {
      return false;
    }

    if (maxPrice !== undefined && numericPrice > maxPrice) {
      return false;
    }

    return true;
  });
};

export const updateTrendingScore = async (
  productId: string,
  action: 'VIEW' | 'LIKE' | 'CLICK'
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

  const recentSearches = await prisma.productSearch.findMany({
    where: {
      userId: params.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    select: {
      prompt: true,
      parsedParams: true,
    },
  });

  const searchPreferenceProfile = buildSearchPreferenceProfile(recentSearches);

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
    .map(product => {
      const demographicScore = buildRecommendationScore({
        userAge: user.age,
        userGender: user.gender,
        userInterests: user.interests,
        userLocation: user.location,
        product,
      });

      const searchHistoryScore = buildSearchHistoryScore({
        profile: searchPreferenceProfile,
        product,
      });

      return {
        id: product.id,
        title: product.title,
        source: product.source,
        defaultImageUrl: product.defaultImageUrl,
        price: product.price,
        viewCount: product.viewCount,
        likeCount: product.likeCount,
        recommendationScore: Number(
          (demographicScore + searchHistoryScore).toFixed(6)
        ),
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  return rankedProducts.slice(safeSkip, safeSkip + safeLimit);
};

export const likeProductDB = async (
  productId: string,
  userId: string,
  status: boolean = true
) => {
  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingLike) {
      return { message: 'Product already liked' };
    }

    await prisma.like.create({
      data: {
        userId,
        productId,
        status,
      },
    });

    await updateTrendingScore(productId, 'LIKE');

    return { message: 'Product liked successfully' };
  } catch (error) {
    throw new Error('Failed to like product');
  }
};

export const addFavoriteDB = async (
  userId: string,
  ids: { productId?: string; tryonId?: string },
  status: boolean = true
) => {
  const { productId, tryonId } = ids;

  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      userId,
      productId: productId || null,
      tryonId: tryonId || null,
    },
  });

  if (existingFavorite) {
    return { message: 'Product already in favorites' };
  }

  try {
    await prisma.favorite.create({
      data: {
        userId,
        productId,
        tryonId,
        status,
      },
    });

    return { message: 'Product added to favorites successfully' };
  } catch (error: any) {
    // Safety check for race conditions
    if (error.code === 'P2002') {
      return { message: 'Product already in favorites' };
    }
    throw new Error('Failed to add favorite');
  }
};
