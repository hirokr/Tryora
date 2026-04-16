import logger from '#src/config/logger.ts';
import {
  createTryOnImageGenerationJob,
  getUserTryOnImageById,
  getUserTryOnImages,
  ImageTryOnError,
} from '#src/services/image.service.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import {
  CreateTryOnImagesInput,
  getUserTryOnImageByIdParamsSchema,
  getUserTryOnImagesQuerySchema,
} from '#src/validations/image.validation.ts';
import { Response } from 'express';
import { ZodError } from 'zod/v3';

export const createTryOnFromProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const body = req.body as CreateTryOnImagesInput;
    const result = await createTryOnImageGenerationJob({
      userId: req.userId,
      productIds: body.productIds,
      bodyImageId: body.bodyImageId,
      poseImageUrl: body.poseImageUrl,
      poser: body.poser,
      category: body.category,
    });

    return res.status(202).json(result);
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

export const getUserTryOnImagesPaginated = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = await getUserTryOnImagesQuerySchema.parseAsync(req.query);
    const result = await getUserTryOnImages({
      userId: req.userId,
      page: query.page,
      limit: query.limit,
      skip: query.skip,
    });

    return res.status(200).json({
      message: 'Try-on images fetched successfully',
      pagination: result.pagination,
      images: result.images,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.errors[0]?.message || 'Validation error',
        errors: error.flatten().fieldErrors,
      });
    }

    logger.error('[TryOn] Failed to fetch try-on images', {
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      message: 'Failed to fetch try-on images',
    });
  }
};

export const getUserTryOnImageByIdHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { tryonResultId } = await getUserTryOnImageByIdParamsSchema.parseAsync(
      req.params
    );

    const image = await getUserTryOnImageById({
      userId: req.userId,
      tryonResultId,
    });

    return res.status(200).json({
      message: 'Try-on image fetched successfully',
      image,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.errors[0]?.message || 'Validation error',
        errors: error.flatten().fieldErrors,
      });
    }

    if (error instanceof ImageTryOnError) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details,
      });
    }

    logger.error('[TryOn] Failed to fetch try-on image by id', {
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      message: 'Failed to fetch try-on image',
    });
  }
};
