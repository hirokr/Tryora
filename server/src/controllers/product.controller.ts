import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import {
  getProductDetailsById as getProductDetailsByIdFromDb,
  getProductsService,
  getTopTrending,
} from '#src/services/product.service.ts';

export const getProductDetailsById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId } = req.params;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await getProductDetailsByIdFromDb(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch product details',
    });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const numericLimit =
      typeof limit === 'string' && !isNaN(parseInt(limit))
        ? parseInt(limit)
        : 20;
    const numericSkip =
      typeof skip === 'string' && !isNaN(parseInt(skip)) ? parseInt(skip) : 0;

    const products = await getProductsService(numericLimit, numericSkip);

    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'success',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch products',
    });
  }
};

export const getTopTrendingProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const numericLimit =
      typeof limit === 'string' && !isNaN(parseInt(limit))
        ? parseInt(limit)
        : 20;
    const numericSkip =
      typeof skip === 'string' && !isNaN(parseInt(skip)) ? parseInt(skip) : 0;

    const products = await getTopTrending(numericLimit, numericSkip);

    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'success',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch trending products',
    });
  }
};
