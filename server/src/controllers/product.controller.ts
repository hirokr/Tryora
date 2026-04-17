import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import {
  findProductById,
  getProductDetailsById as getProductDetailsByIdFromDb,
  getTopTrending,
  updateProductAppearance as updateProductAppearanceInDb,
} from '#src/services/product.service.ts';

import { editProductImage } from '#src/utils/image/imageEdit.ts';
import { createJob } from '#src/services/job.service.ts';

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
    const { userPrompt } = req.body;

    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({ message: 'Invalid user prompt' });
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await findProductById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const startEditingImage = await editProductImage({
      productImageUrl: product.defaultImageUrl,
      userPrompt,
    });
    if (!startEditingImage || !startEditingImage.data) {
      return res.status(500).json({
        message: 'Failed to start image editing',
      });
    }

    const jobStart = await createJob({
      userId: req.userId,
      productId,
      jobType: 'IMAGE_EDIT',
      userPrompt,
      thirdPartyTaskId: startEditingImage.data.id,
      outputresultUrl: startEditingImage.data.result_url,
    });

      await enqueueProductImageEditJob({

      })


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
