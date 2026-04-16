import { Router } from 'express';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  getProductDetailsById,
  updateProductAppearance,
} from '#src/controllers/product.controller.ts';
import { editProductImageAppearance } from '#src/controllers/productImageEdit.controller.ts';
import {
  editProductImageAppearanceSchema,
  updateProductAppearanceSchema,
} from '#src/validations/product.validation.ts';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product maintenance endpoints.
 */

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Get one product details by id
 *     description: Returns one product and related image records for the authenticated user.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to fetch.
 *     responses:
 *       200:
 *         description: Product details fetched successfully
 *       400:
 *         description: Invalid product id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to fetch product details
 */
router.get('/:productId', getProductDetailsById);

/**
 * @swagger
 * /api/products/{productId}/appearance:
 *   patch:
 *     summary: Update product color and pattern tags
 *     description: |
 *       Updates the stored appearance metadata for a product.
 *       Authentication is required.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               colorTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [black, beige]
 *               patternTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [striped, floral]
 *     responses:
 *       200:
 *         description: Product appearance updated successfully
 *       400:
 *         description: Invalid product id or invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to update product appearance
 */
router.patch(
  '/:productId/appearance',
  validateRequest(updateProductAppearanceSchema),
  updateProductAppearance
);

/**
 * @swagger
 * /api/products/{productId}/appearance/ai-edit:
 *   post:
 *     summary: Queue an edited product image generation job
 *     description: |
 *       Creates an asynchronous generation job for product AI-edit.
 *       Use `GET /api/jobs/{jobId}` to poll progress and final output image URL.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to edit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - color
 *             properties:
 *               color:
 *                 type: string
 *                 example: black
 *               pattern:
 *                 type: string
 *                 example: striped
 *               prompt:
 *                 type: string
 *                 example: Change only the outfit to matte black with subtle thin stripes.
 *               model:
 *                 type: string
 *                 enum: [v1, v2]
 *                 example: v2
 *               aspectRatio:
 *                 type: string
 *                 enum: [1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9]
 *                 example: 1:1
 *               inferenceSteps:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 30
 *               guidanceScale:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 7
 *               format:
 *                 type: string
 *                 enum: [png, jpeg]
 *                 example: png
 *     responses:
 *       202:
 *         description: Product image edit job accepted and queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - jobId
 *                 - status
 *               properties:
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: [QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *       400:
 *         description: Invalid product id or invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to update product image
 */
router.post(
  '/:productId/appearance/ai-edit',
  validateRequest(editProductImageAppearanceSchema),
  editProductImageAppearance
);

export default router;
