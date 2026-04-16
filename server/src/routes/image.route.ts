import { Router } from 'express';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  createTryOnFromProducts,
  getUserTryOnImageByIdHandler,
  getUserTryOnImagesPaginated,
} from '#src/controllers/image.controller.ts';
import { createTryOnImagesSchema } from '../validations/image.validation.ts';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: TryOn Image
 *     description: Generate one try-on image from a user pose image and selected products.
 */

/**
 * @swagger
 * /api/images/previous-try-ons:
 *   get:
 *     summary: Get previous try-on images for the authenticated user
 *     description: Returns the authenticated user's try-on image history with pagination.
 *     tags:
 *       - TryOn Image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to fetch.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: Try-on images fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Try-on images fetched successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tryonResultId:
 *                         type: string
 *                       bodyImageId:
 *                         type: string
 *                       productId:
 *                         type: string
 *                         nullable: true
 *                       imageUrl:
 *                         type: string
 *                         format: uri
 *                       thumbnailUrl:
 *                         type: string
 *                         format: uri
 *                         nullable: true
 *                       isFavorite:
 *                         type: boolean
 *                       isPublic:
 *                         type: boolean
 *                       viewCount:
 *                         type: integer
 *                       glbUrl:
 *                         type: string
 *                         format: uri
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch try-on images
 */
router.get('/images/previous-try-ons', getUserTryOnImagesPaginated);

/**
 * @swagger
 * /api/images/previous-try-ons/{tryonResultId}:
 *   get:
 *     summary: Get one try-on image by id for the authenticated user
 *     description: Returns a single try-on image record by id if it belongs to the authenticated user.
 *     tags:
 *       - TryOn Image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tryonResultId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Try-on result ID.
 *     responses:
 *       200:
 *         description: Try-on image fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Try-on image fetched successfully
 *                 image:
 *                   type: object
 *                   properties:
 *                     tryonResultId:
 *                       type: string
 *                     bodyImageId:
 *                       type: string
 *                     productId:
 *                       type: string
 *                       nullable: true
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                     thumbnailUrl:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *                     isFavorite:
 *                       type: boolean
 *                     isPublic:
 *                       type: boolean
 *                     viewCount:
 *                       type: integer
 *                     glbUrl:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid try-on result ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Try-on image not found
 *       500:
 *         description: Failed to fetch try-on image
 */
router.get(
  '/images/previous-try-ons/:tryonResultId',
  getUserTryOnImageByIdHandler
)

/**
 * @swagger
 * /api/images/try-on:
 *   post:
 *     summary: Generate one try-on image for selected products
 *     description: Uses the authenticated user's body image (or a direct pose image URL) and selected product IDs to generate a single try-on image. The generated image is mirrored to owned blob storage, saved as a try-on result, and returned to the frontend.
 *     tags:
 *       - TryOn Image
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
 *                 description: Product IDs used as garment references for one generated try-on image.
 *                 items:
 *                   type: string
 *                 minItems: 1
 *               productIdeas:
 *                 type: array
 *                 description: Alias of productIds supported for frontend compatibility.
 *                 items:
 *                   type: string
 *                 minItems: 1
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
 *             anyOf:
 *               - required: [productIds]
 *               - required: [productIdeas]
 *     responses:
 *       201:
 *         description: Try-on image generated successfully
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
 *                   nullable: true
 *                 images:
 *                   type: array
 *                   minItems: 1
 *                   maxItems: 1
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
