import prisma from '#src/config/database.ts';

export const findProductById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
  });
};

export const getProductDetailsById = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  });
};

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
