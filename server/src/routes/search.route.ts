// -
import {
  getProductsBySearchId,
  getUserSearchHistory,
  searchProducts,
  // updateProductMetrics,
} from '#src/controllers/search.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Search
 *     description: AI-powered product discovery, user search history, and product retrieval endpoints.
 */

/**
 * @swagger
 * /api/search/search:
 *   post:
 *     summary: Run an AI product search
 *     description: |
 *       Accepts a natural-language user prompt, extracts structured intent, performs multi-query external shopping search,
 *       de-duplicates products, stores the search and products, and returns either cached or fresh results.
 *
 *       Behavior by scenario:
 *       - `status: cached` when a previous matching intent already exists.
 *       - `status: fresh` when a new search is executed and results are saved.
 *       - `status: empty` when extraction works but no product results are found.
 *
 *       Authentication is required.
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
 *               - userInput
 *             properties:
 *               userInput:
 *                 type: string
 *                 minLength: 1
 *                 description: Natural-language shopping intent entered by the user.
 *                 example: Show me a modern black cocktail dress for an evening event under 150 dollars
 *               geo:
 *                 type: object
 *                 description: Optional geographic context used to influence regional result relevance.
 *                 additionalProperties: true
 *                 example:
 *                   country: US
 *                   city: New York
 *                   locale: en-US
 *     responses:
 *       200:
 *         description: Search handled successfully (cached, fresh, or empty)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Cached response for previously seen intent
 *                   required:
 *                     - status
 *                     - intentKey
 *                     - results
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [cached]
 *                     intentKey:
 *                       type: string
 *                       example: dress|cocktail|modern|evening|women
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 5a18e4f6-df8b-4a8f-ab0f-7ac0be9f4f3f
 *                           searchId:
 *                             type: string
 *                             format: uuid
 *                             example: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *                           title:
 *                             type: string
 *                             example: Satin Midi Cocktail Dress
 *                           price:
 *                             type: number
 *                             nullable: true
 *                             example: 129.99
 *                           currency:
 *                             type: string
 *                             nullable: true
 *                             example: USD
 *                           image:
 *                             type: string
 *                             format: uri
 *                             example: https://cdn.example.com/products/dress-1.jpg
 *                           category:
 *                             type: string
 *                             nullable: true
 *                             example: Dresses
 *                           colorTags:
 *                             nullable: true
 *                             description: Optional color metadata captured from source data.
 *                           brand:
 *                             type: string
 *                             nullable: true
 *                             example: Zara
 *                           source:
 *                             type: string
 *                             nullable: true
 *                             example: Zara
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             example: 4.6
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           editedAt:
 *                             type: string
 *                             format: date-time
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                 - type: object
 *                   description: Fresh response after a newly executed search
 *                   required:
 *                     - status
 *                     - intentKey
 *                     - searchId
 *                     - results
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [fresh]
 *                     intentKey:
 *                       type: string
 *                       example: dress|cocktail|modern|evening|women
 *                     searchId:
 *                       type: string
 *                       format: uuid
 *                       example: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: Embellished Evening Cocktail Dress
 *                           link:
 *                             type: string
 *                             format: uri
 *                             nullable: true
 *                             example: https://shop.example.com/p/12345
 *                           price:
 *                             type: number
 *                             nullable: true
 *                             example: 139.0
 *                           currency:
 *                             type: string
 *                             nullable: true
 *                             example: USD
 *                           image:
 *                             type: string
 *                             format: uri
 *                             example: https://cdn.example.com/products/dress-2.jpg
 *                           category:
 *                             type: string
 *                             nullable: true
 *                             example: Women Clothing
 *                           colorTags:
 *                             nullable: true
 *                           brand:
 *                             type: string
 *                             nullable: true
 *                             example: Mango
 *                           source:
 *                             type: string
 *                             nullable: true
 *                             example: Mango
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             example: 4.2
 *                 - type: object
 *                   description: No product matches found for the extracted queries
 *                   required:
 *                     - status
 *                     - intentKey
 *                     - results
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [empty]
 *                     intentKey:
 *                       type: string
 *                       example: dress|cocktail|modern|evening|women
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                       example: []
 *             examples:
 *               cached:
 *                 summary: Cached intent hit
 *                 value:
 *                   status: cached
 *                   intentKey: dress|cocktail|modern|evening|women
 *                   results:
 *                     - id: 5a18e4f6-df8b-4a8f-ab0f-7ac0be9f4f3f
 *                       searchId: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *                       title: Satin Midi Cocktail Dress
 *                       price: 129.99
 *                       currency: USD
 *                       image: https://cdn.example.com/products/dress-1.jpg
 *                       source: Zara
 *               fresh:
 *                 summary: Freshly executed search
 *                 value:
 *                   status: fresh
 *                   intentKey: dress|cocktail|modern|evening|women
 *                   searchId: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *                   results:
 *                     - title: Embellished Evening Cocktail Dress
 *                       link: https://shop.example.com/p/12345
 *                       price: 139
 *                       currency: USD
 *                       image: https://cdn.example.com/products/dress-2.jpg
 *                       source: Mango
 *               empty:
 *                 summary: No products found
 *                 value:
 *                   status: empty
 *                   intentKey: dress|cocktail|modern|evening|women
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
 *                   example: Invalid input
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
 *         description: Internal server error while processing search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/search', searchProducts);

/**
 * @swagger
 * /api/search/history:
 *   get:
 *     summary: Get current user's search history
 *     description: |
 *       Returns product search records for the authenticated user sorted by most recent first.
 *       This endpoint returns metadata about each search (prompt, intent key, status, timestamps,
 *       parsed parameters, geo context), not product lists.
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User history retrieved (or empty list)
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
 *                       enum: [cached]
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           prompt:
 *                             type: string
 *                             example: modern black cocktail dress under 150
 *                           intentKey:
 *                             type: string
 *                             example: dress|cocktail|modern|evening|women
 *                           parsedParams:
 *                             nullable: true
 *                             description: Structured AI-extracted intent fields.
 *                           queries:
 *                             nullable: true
 *                             description: Generated query set used for external search.
 *                           geo:
 *                             nullable: true
 *                             description: Optional regional search context.
 *                           status:
 *                             type: string
 *                             enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *                           errorMessage:
 *                             type: string
 *                             nullable: true
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
 *               hasHistory:
 *                 summary: History exists
 *                 value:
 *                   status: cached
 *                   results:
 *                     - id: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *                       userId: 6ec6ef6c-fc44-4ca8-833e-1c06137cf62f
 *                       prompt: modern black cocktail dress under 150
 *                       intentKey: dress|cocktail|modern|evening|women
 *                       status: COMPLETED
 *                       createdAt: 2026-04-13T10:02:11.000Z
 *                       updatedAt: 2026-04-13T10:02:31.000Z
 *               noHistory:
 *                 summary: No history for user
 *                 value:
 *                   status: empty
 *                   results: []
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
 *         description: Failed to fetch search history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: failed to fetch search history
 */
router.get('/history', getUserSearchHistory);

/**
 * @swagger
 * /api/search/{searchId}/products:
 *   get:
 *     summary: Get products by search ID
 *     description: |
 *       Returns products that belong to a specific search record for the authenticated user.
 *       If the search has no products, an empty response is returned with `status: empty`.
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: searchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the search record.
 *         example: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *     responses:
 *       200:
 *         description: Products fetched for the given search ID (or empty)
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
 *                       enum: [cached]
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
 *                           colorTags:
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
 *       400:
 *         description: Invalid path parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid search id
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
 *         description: Failed to fetch products for search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: failed to fetch products for this search
 */
router.get('/:searchId/products', getProductsBySearchId);

/**
 * @swagger
 * /api/search/product-metric/{productId}:
 *   post:
 *     summary: Update a product's engagement metric
 *     description: |
 *       Updates product interaction counters and recalculates trending score.
 *       Accepted action values are `VIEW`, `CLICK`, and `LIKE` (case-insensitive).
 *     tags:
 *       - Search
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
 *         example: 5a18e4f6-df8b-4a8f-ab0f-7ac0be9f4f3f
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [VIEW, CLICK, LIKE]
 *                 description: Interaction type to record.
 *                 example: VIEW
 *     responses:
 *       200:
 *         description: Product metrics updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *                 - data
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     likeCount:
 *                       type: integer
 *                       nullable: true
 *                     viewCount:
 *                       type: integer
 *                       nullable: true
 *                     orderCount:
 *                       type: integer
 *                       nullable: true
 *                     trendingScore:
 *                       type: number
 *                       nullable: true
 *             examples:
 *               success:
 *                 summary: Metric updated
 *                 value:
 *                   status: success
 *                   data:
 *                     id: 5a18e4f6-df8b-4a8f-ab0f-7ac0be9f4f3f
 *                     likeCount: 12
 *                     viewCount: 84
 *                     orderCount: 3
 *                     trendingScore: 91.3
 *       400:
 *         description: Invalid product ID or action type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid action type
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
 *         description: Failed to update product metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: failed to update product metrics
 */
// router.post('/product-metric/:productId', updateProductMetrics);

export default router;
