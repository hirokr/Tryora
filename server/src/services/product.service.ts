import prisma from '#src/config/database.ts';

export const findProductById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
  });
};

export const getProductDetailsById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
    select: {
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
    },
  });
};

// todo: call external service to get product details and update db record if needed
export const updateProductAppearance = async (
  productId: string,
  appearance: {
    colorTags?: string[];
    patternTags?: string[];
  }
) => {
  const data: {
    colorTags?: string[];
    patternTags?: string[];
  } = {};

  if (appearance.colorTags !== undefined) {
    data.colorTags = appearance.colorTags;
  }

  if (appearance.patternTags !== undefined) {
    data.patternTags = appearance.patternTags;
  }

  return prisma.product.update({
    where: { id: productId },
    data,
  });
};

export const getTopTrending = async (limit: number = 20, skip: number = 0) => {
  return await prisma.product.findMany({
    orderBy: {
      trendingScore: 'desc',
    },
    take: limit,
    skip: skip,
  });
};
