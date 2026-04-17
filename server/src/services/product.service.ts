import prisma from '#src/config/database.ts';

export const findProductById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
  });
};

export const getProductsService = async (limit: number = 20, skip: number = 0) => {
  return prisma.product.findMany({
    take: limit,
    skip: skip,
    select:{
      id: true,
      title: true,
      source: true,
      defaultImageUrl: true,
      price: true,
      viewCount: true,
      likeCount: true,
    }
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
  return await prisma.product.findMany({
    orderBy: {
      trendingScore: 'desc',
    },
    take: limit,
    skip: skip,
  });
};
