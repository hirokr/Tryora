import { Router } from 'express';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import { createTryOnFromProducts } from '#src/controllers/image.controller.ts';
import { createTryOnImagesSchema } from '../validations/image.validation.ts';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: TryOn Images
 *     description: Generate try-on images from user pose image and selected products.
 */

/**
 * @swagger
 * /api/images/try-on:
 *   post:
 *     summary: Generate try-on images for selected products
 *     description: Uses the authenticated user's body image (or a direct pose image URL) and product IDs to generate try-on results. Generated image URLs are saved as try-on results.
 *     tags:
 *       - TryOn Images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 description: Product IDs to generate try-on images for.
 *                 items:
 *                   type: string
 *               productIdeas:
 *                 type: array
 *                 description: Alias of productIds supported for frontend compatibility.
 *                 items:
 *                   type: string
 *               bodyImageId:
 *                 type: string
 *                 description: Existing body image ID.
 *               poseImageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Direct URL of a pose image, e.g. front pose.
 *               poser:
 *                 type: string
 *                 enum: [front, side, back]
 *                 description: Pose direction.
 *               category:
 *                 type: string
 *                 enum: [tops, bottoms, full_body]
 *                 description: Garment category.
 *     responses:
 *       201:
 *         description: Try-on images generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Try-on image generated successfully
 *                 bodyImageId:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tryonResultId:
 *                         type: string
 *                       productId:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                         format: uri
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Body image or product not found
 *       500:
 *         description: Failed to generate try-on images
 */

router.post(
  '/images/try-on',
  validateRequest(createTryOnImagesSchema),
  createTryOnFromProducts
);

export default router;
