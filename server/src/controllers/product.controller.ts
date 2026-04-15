import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import {
  findProductById,
  getProductDetailsById as getProductDetailsByIdFromDb,
  updateProductAppearance as updateProductAppearanceInDb,
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

export const updateProductAppearance = async (
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

    const product = await findProductById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await updateProductAppearanceInDb(
      productId,
      req.body
    );

    return res.status(200).json({
      status: 'success',
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to update product appearance',
    });
  }
};
