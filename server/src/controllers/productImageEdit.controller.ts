import logger from '#src/config/logger.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import { ProductAppearanceEditInput } from '#src/types/productImageEdit.js';
import {
  editProductAppearanceAndSaveImage,
  ProductImageEditError,
} from '#src/services/productImageEdit.service.ts';
import { Response } from 'express';

export const editProductImageAppearance = async (
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

    const body = req.body as ProductAppearanceEditInput;
    const result = await editProductAppearanceAndSaveImage(productId, body);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ProductImageEditError) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details,
      });
    }

    logger.error('[Product Ai Edit] Failed to update product image', {
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      message: 'Failed to update product image',
    });
  }
};
