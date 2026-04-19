import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { getRuntimeProductRecommendations } from '#src/controllers/recommendation.controller.ts';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Recommendation
 *     description: Personalized runtime recommendation endpoints.
 */

router.use(authMiddleware);


/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get personalized recommendations
 *     description: |
 *       Canonical recommendation endpoint. Returns personalized product ranking
 *       for the authenticated user with optional paging and category filter.
 *     tags:
 *       - Recommendation
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
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         example: Jackets
 *     responses:
 *       200:
 *         description: Recommendations fetched successfully or empty.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/RecommendationSuccessResponse'
 *                 - $ref: '#/components/schemas/RecommendationEmptyResponse'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to fetch runtime recommendations.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/', getRuntimeProductRecommendations);

export default router;
