import { Router } from 'express';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import { updateProductAppearance } from '#src/controllers/product.controller.ts';
import { updateProductAppearanceSchema } from '#src/validations/product.validation.ts';

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

export default router;
