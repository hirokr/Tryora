import prisma from '#src/config/database.ts';
import { Product } from '#src/types/product.js';

/**
 * CHECK CACHE BY INTENT KEY
 */
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

/**
 * CREATE NEW SEARCH RECORD
 */
export const createSearch = async (data: {
  prompt: string;
  intentKey: string;
  parsedParams?: any;
  geo?: any;
  userId?: string;
}) => {
  const searchRecord = await prisma.productSearch.create({
    data: {
      prompt: data.prompt,
      intentKey: data.intentKey,
      parsedParams: data.parsedParams,
      geo: data.geo,
      userId: data.userId,
      status: 'PENDING',
      startedAt: new Date(),
    },
  });

  return searchRecord;
};

/**
 * UPDATE SEARCH STATUS
 */
export const updateSearchStatus = async (
  searchId: string,
  status: 'PENDING' | 'COMPLETED' | 'FAILED',
  errorMessage?: string
) => {
  return prisma.productSearch.update({
    where: { id: searchId },
    data: {
      status,
      errorMessage,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
    },
  });
};

/**
 * SAVE PRODUCTS FOR A SEARCH
 */
export const setProducts = async (searchId: string, productData: Product[]) => {
  if (!productData.length) return { count: 0 };

  const data = productData.map(p => ({
    searchId, // 🔥 FIXED: required relation field
    title: p.title,
    price: p.price,
    link: p.link,
    image: p.image,
    source: p.source,
  }));

  return prisma.product.createMany({
    data,
    skipDuplicates: true,
  });
};

/**
 * GET SEARCH WITH PRODUCTS
 */
export const getSearchById = async (searchId: string) => {
  return prisma.productSearch.findUnique({
    where: { id: searchId },
    include: { products: true },
  });
};

/**
 * GET SEARCH BY INTENT KEY
 */
export const getSearchByIntent = async (intentKey: string) => {
  return prisma.productSearch.findFirst({
    where: { intentKey },
    orderBy: { createdAt: 'desc' },
    include: { products: true },
  });
};

/**
 * GET USER SEARCH HISTORY
 */
export const getSearchesByUserId = async (userId: string) => {
  return prisma.productSearch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProductsBySearchID = async (
  searchId: string,
  userId: string
) => {
  return prisma.product.findMany({ where: { searchId, userId } });
};

export const getProductById = async (productId: string) => {
  return prisma.product.findUnique({ where: { id: productId } });
};


export const getProductsByfilters = async (filters: {
  minPrice?: number;
  maxPrice?: number;
  source?: string;
  catogory?: string;
  subCatogory?: string;
  brand?: string;
  title?: string;
  color?: string;
}) => {
  const where: any = {};
  if (filters.minPrice !== undefined) where.price = { gte: filters.minPrice };
  if (filters.maxPrice !== undefined)
    where.price = { ...where.price, lte: filters.maxPrice };
  if (filters.source) where.source = filters.source;
  if (filters.catogory) where.category = filters.catogory;
  if (filters.subCatogory) where.subCategory = filters.subCatogory;
  if (filters.brand) where.brand = filters.brand;
  if (filters.title) where.title = filters.title;
  if (filters.color) where.color = filters.color;

  return prisma.product.findMany({ where });


};