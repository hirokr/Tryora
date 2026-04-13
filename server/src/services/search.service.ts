import prisma from '#src/config/database.ts';
import { Product } from '#src/types/product.js';

export const setProduct = async (productData: Product[]) => {
  const productDataToSete = await prisma.product.createMany({
    data: productData,
    skipDuplicates: true,
  });

  return productDataToSete;
};

export const getProductsBySearchId = async (searchId: string) => {
  const products = await prisma.product.findMany({
    where: { searchId },
  });

  return products;
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  return product;
};

export const getProductsByUserId = async (userId: string) => {
  const products = await prisma.product.findMany({
    where: { userId },
  });

  return products;
};
