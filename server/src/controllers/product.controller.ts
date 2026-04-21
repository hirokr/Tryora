import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import {
  addFavoriteDB,
  getProductDetailsById as getProductDetailsByIdFromDb,
  getProductsByfilters,
  getProductsService,
  getTopTrending,
  likeProductDB,
} from '#src/services/product.service.ts';

export const getProductDetailsById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
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

export const likeProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await likeProductDB(productId, req.userId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Here you would typically update the product's like count in the database
    // and also keep track of which users have liked which products to prevent multiple likes from the same user.

    return res.status(200).json({
      status: 'success',
      message: product.message,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to like product',
    });
  }
};

export const addFavoriteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const favorite = await addFavoriteDB(req.userId, { productId });

    return res.status(200).json({
      status: 'success',
      message: favorite.message,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to add product to favorites',
    });
  }
};

// object: {filterQuery: {
//   minPrice: 20;
// maxPrice: 1000;
// source: arong;
// catogory: saree;
// subCatogory: bangladeshi;
// brand: arong;
// title: saree;
// color: red;
// }}
export const searchProductsByQuery = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { filterQuery } = req.body;
    const { limit = 20, skip = 0 } = req.query;
    if (!filterQuery || typeof filterQuery !== 'object') {
      return res.status(400).json({ message: 'Invalid filter query' });
    }

    const products = await getProductsByfilters(
      filterQuery,
      Number(limit),
      Number(skip)
    );
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
      message: 'failed to fetch products for this search ',
    });
  }
};

export const unlikeProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await likeProductDB(productId, req.userId, false);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      status: 'success',
      message: product.message,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to unlike product',
    });
  }
};

export const removeFavoriteProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { productId } = req.params;
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const favorite = await addFavoriteDB(req.userId, { productId }, false);

    return res.status(200).json({
      status: 'success',
      message: favorite.message,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to remove product from favorites',
    });
  }
};
