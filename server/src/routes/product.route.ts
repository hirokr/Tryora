import { Router } from 'express';
// import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  addFavoriteProduct,
  getProductDetailsById,
  getProducts,
  getTopTrendingProducts,
  likeProduct,
  searchProductsByQuery,
} from '#src/controllers/product.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product browsing and details endpoints.
 */

/**
 * @swagger
 * /api/products/discover:
 *   get:
 *     summary: Get top discoverable products
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
router.get('/discover', getTopTrendingProducts);

/**
 * @swagger
 * /api/products:
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
router.get('/', getProducts);

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
router.get('/:productId', getProductDetailsById);

/**
 * @swagger
 * /api/products/search-filter:
 *   post:
 *     summary: Search products using structured filters
 *     description: |
 *       Returns products that match a structured filter object.
 *       This endpoint is useful when the client already has explicit filter values
 *       and does not need AI intent extraction.
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filterQuery
 *             properties:
 *               filterQuery:
 *                 type: object
 *                 description: Product filter criteria.
 *                 properties:
 *                   minPrice:
 *                     type: number
 *                     nullable: true
 *                     example: 20
 *                   maxPrice:
 *                     type: number
 *                     nullable: true
 *                     example: 1000
 *                   source:
 *                     type: string
 *                     nullable: true
 *                     example: Zara
 *                   catogory:
 *                     type: string
 *                     nullable: true
 *                     description: Category filter key used by current API contract.
 *                     example: Dresses
 *                   subCatogory:
 *                     type: string
 *                     nullable: true
 *                     description: Sub-category filter key used by current API contract.
 *                     example: Cocktail
 *                   brand:
 *                     type: string
 *                     nullable: true
 *                     example: Mango
 *                   title:
 *                     type: string
 *                     nullable: true
 *                     example: satin dress
 *                   color:
 *                     type: string
 *                     nullable: true
 *                     example: black
 *           examples:
 *             basicFilter:
 *               summary: Filter by price, category, and color
 *               value:
 *                 filterQuery:
 *                   minPrice: 30
 *                   maxPrice: 200
 *                   catogory: Dresses
 *                   color: black
 *     responses:
 *       200:
 *         description: Filtered products returned successfully (or no matching products)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   required:
 *                     - status
 *                     - results
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [success]
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           searchId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                             nullable: true
 *                           currency:
 *                             type: string
 *                             nullable: true
 *                           image:
 *                             type: string
 *                             format: uri
 *                           category:
 *                             type: string
 *                             nullable: true
 *                           subCategory:
 *                             type: string
 *                             nullable: true
 *                           color:
 *                             type: string
 *                             nullable: true
 *                           brand:
 *                             type: string
 *                             nullable: true
 *                           source:
 *                             type: string
 *                             nullable: true
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           editedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                 - type: object
 *                   required:
 *                     - status
 *                     - results
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [empty]
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                       example: []
 *             examples:
 *               success:
 *                 summary: Matching products found
 *                 value:
 *                   status: success
 *                   results:
 *                     - id: 5a18e4f6-df8b-4a8f-ab0f-7ac0be9f4f3f
 *                       title: Satin Midi Cocktail Dress
 *                       price: 129.99
 *                       currency: USD
 *                       source: Zara
 *               empty:
 *                 summary: No matching products
 *                 value:
 *                   status: empty
 *                   results: []
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid filter query
 *       401:
 *         description: Missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Failed to fetch products by query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: failed to fetch products for this search
 */
router.post('/search-filter', searchProductsByQuery);

router.use(authMiddleware);

router.post('/like/:productId', likeProduct);

router.post('/favourite/:productId', addFavoriteProduct);

export default router;
