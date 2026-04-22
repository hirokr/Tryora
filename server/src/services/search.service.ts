import prisma from '#src/config/database.ts';
import { Product } from '#src/types/product.js';

export const checkIntent = async (intentKey: string) => {
  const cached = await prisma.productSearch.findFirst({
    where: { intentKey },
    orderBy: { createdAt: 'desc' },
    include: { products: true },
  });

  if (!cached) {
    return {
      status: 'miss',
      data: null,
    };
  }

  return {
    status: 'cached',
    data: cached,
    results: cached.products,
  };
};

export const createSearch = async (data: {
  prompt: string;
  intentKey: string;
  parsedParams?: any;
  location?: string;
  userId?: string;
}) => {
  const searchRecord = await prisma.productSearch.create({
    data: {
      prompt: data.prompt,
      intentKey: data.intentKey,
      parsedParams: data.parsedParams,
      userId: data.userId,
      location: data.location,
    },
  });

  return searchRecord;
};

export const setProducts = async (searchId: string, productData: Product[]) => {
  const data = productData.map(p => ({
    searchId,
    title: p.title,
    source: p.source,
    googlelink: p.googlelink,
    price: p.price,
    defaultImageUrl: p.defaultImageUrl,
    rating: p.rating,
    ratingCount: p.ratingCount,
    searchProductId: p.searchProductId,
  }));

  return prisma.product.createMany({
    data,
    skipDuplicates: true,
  });
};

export const getSearchById = async (searchId: string) => {
  return prisma.productSearch.findUnique({
    where: { id: searchId },
    include: { products: true },
  });
};

export const getSearchByIntent = async (intentKey: string) => {
  return prisma.productSearch.findFirst({
    where: { intentKey },
    orderBy: { createdAt: 'desc' },
    include: { products: true },
  });
};

export const getSearchesByUserId = async (userId: string) => {
  return prisma.productSearch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      prompt: true,
      intentKey: true,
    }
  });
};
