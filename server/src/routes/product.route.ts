import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  getProductDetailsById,
  getProducts,
  getTopTrendingProducts,
} from '#src/controllers/product.controller.ts';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product browsing and details endpoints.
 */

/**
 * @swagger
 * /api/products/trending:
 *   get:
 *     summary: Get top trending products
 *     description: |
 *       Returns products ranked by `trendingScore` in descending order.
 *       Supports pagination with `limit` and `skip` query parameters.
 *       This endpoint is public.
 *     tags:
 *       - Product
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of products to return.
 *         example: 20
 *       - in: query
 *         name: skip
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of products to skip.
 *         example: 0
 *     responses:
 *       200:
 *         description: Trending products fetched successfully or no products available.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ProductListSuccessResponse'
 *                 - $ref: '#/components/schemas/ProductListEmptyResponse'
 *       500:
 *         description: Failed to fetch trending products.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/trending', getTopTrendingProducts);

/**
 * @swagger
 * /api/products/product:
 *   get:
 *     summary: Get products feed
 *     description: |
 *       Returns a paginated list of products ordered by creation date (latest first).
 *       Requires authentication.
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         example: 20
 *       - in: query
 *         name: skip
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         example: 0
 *     responses:
 *       200:
 *         description: Product list fetched successfully or empty.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ProductListSuccessResponse'
 *                 - $ref: '#/components/schemas/ProductListEmptyResponse'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to fetch products.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/product', authMiddleware, getProducts);

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Get product details by ID
 *     description: |
 *       Returns a single product with variant metadata and engagement counters.
 *       Requires authentication.
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product identifier.
 *         example: 50f8f2d6-78c3-4e79-a9a4-a8d8ac09b2d8
 *     responses:
 *       200:
 *         description: Product details fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDetailSuccessResponse'
 *       400:
 *         description: Invalid product ID parameter.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to fetch product details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/:productId', authMiddleware, getProductDetailsById);

export default router;
