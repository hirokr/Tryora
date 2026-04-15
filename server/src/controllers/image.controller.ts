import logger from '#src/config/logger.ts';
import {
  createTryOnImagesForProducts,
  ImageTryOnError,
} from '#src/services/image.service.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import { CreateTryOnImagesInput } from '#src/validations/image.validation.ts';
import { Response } from 'express';

export const createTryOnFromProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const body = req.body as CreateTryOnImagesInput;
    const result = await createTryOnImagesForProducts({
      userId: req.userId,
      productIds: body.productIds,
      bodyImageId: body.bodyImageId,
      poseImageUrl: body.poseImageUrl,
      poser: body.poser,
      category: body.category,
    });

    return res.status(201).json({
      message: 'Try-on image generated successfully',
      bodyImageId: result.bodyImageId,
      imageUrl: result.images[0]?.imageUrl || null,
      images: result.images,
    });
  } catch (error) {
    if (error instanceof ImageTryOnError) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details,
      });
    }

    logger.error('[TryOn] Failed to create try-on image', {
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      message: 'Failed to generate try-on images',
    });
  }
};
