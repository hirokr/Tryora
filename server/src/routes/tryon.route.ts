import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  fuseProductImages,
  updateProductAppearance,
} from '#src/controllers/image.controller.ts';
import {
  deleteTryOnByIdController,
  discoverTryOns,
  getTryOnByIdController,
  getTryOnsByUserIdController,
} from '#src/controllers/tryon.controller.ts';
import { generateModelTryon } from '#src/controllers/model.controller.ts';
import { getTryonJobStatus } from '#src/controllers/job.controller.ts';

const router = Router();
/**
 * @swagger
 * tags:
 *   - name: TryOn
 *     description: Try-on generation, job tracking, and result retrieval endpoints.
 */
router.use(authMiddleware);

/**
 * @swagger
 * /api/tryon/jobs/{jobId}:
 *   get:
 *     summary: Get try-on job status
 *     description: |
 *       Fetches the current state of a generation job (image try-on, image edit, or 3D model).
 *       The job must belong to the authenticated user.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Generation job ID.
 *         example: 4b4e4d5f-1f0e-4c3d-a8e7-91f95f6dd703
 *     responses:
 *       200:
 *         description: Job state fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonJobStatusSuccessResponse'
 *       400:
 *         description: Invalid job ID parameter.
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
 *       403:
 *         description: Authenticated user does not own the job.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Job not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonJobNotFoundResponse'
 *       500:
 *         description: Failed to fetch job status.
 */
router.get('/jobs/:jobId', getTryonJobStatus);

/**
 * @swagger
 * /api/tryon/trending:
 *   get:
 *     summary: Discover try-on results
 *     description: |
 *       Returns a paginated list of try-on results ordered by latest first.
 *       Requires authentication.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *         description: Try-on results fetched.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonDiscoverResponse'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to fetch try-ons.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get(`/trending`, discoverTryOns);

/**
 * @swagger
 * /api/tryon/model/generate:
 *   post:
 *     summary: Start 3D model generation from try-on result
 *     description: |
 *       Queues a 3D model generation job using an existing try-on result image.
 *       Returns a queued job ID for status polling.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TryonModelGenerateRequest'
 *     responses:
 *       200:
 *         description: Model generation job queued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonModelQueueResponse'
 *       400:
 *         description: Invalid request payload (e.g. invalid tryonId).
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
 *         description: Try-on result not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to queue model generation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post(`/model/generate`, generateModelTryon);

/**
 * @swagger
 * /api/tryon/image/generate:
 *   post:
 *     summary: Start fused image try-on generation
 *     description: |
 *       Queues an image try-on job by combining the user's latest try-on image with one or more product images.
 *       Returns a queued job ID for polling.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TryonImageGenerateRequest'
 *     responses:
 *       200:
 *         description: Image try-on job queued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonImageQueueResponse'
 *       400:
 *         description: Invalid payload (e.g. productIds is missing or not an array).
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
 *       500:
 *         description: Failed to start image fusion.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post(`/image/generate`, fuseProductImages);

/**
 * @swagger
 * /api/tryon/image/edit:
 *   post:
 *     summary: Start product appearance edit
 *     description: |
 *       Queues an image-edit generation for a product (or specific variant) using user prompt instructions.
 *       The route accepts optional path params in the current backend contract (`productId`, `variantId`).
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TryonImageEditRequest'
 *     responses:
 *       200:
 *         description: Image edit job queued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonImageEditQueueResponse'
 *       400:
 *         description: Invalid prompt or product/variant identifiers.
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
 *         description: Product or variant not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to queue image edit job.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/image/edit', updateProductAppearance);

/**
 * @swagger
 * /api/tryon/user/{userId}:
 *   get:
 *     summary: Get try-ons by user ID
 *     description: Returns all try-on records for a given user ID.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID whose try-ons should be returned.
 *         example: 6ec6ef6c-fc44-4ca8-833e-1c06137cf62f
 *     responses:
 *       200:
 *         description: Try-ons fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonRecordListResponse'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to fetch try-ons.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get(`/user/:userId`, getTryOnsByUserIdController);

/**
 * @swagger
 * /api/tryon/item/{tryonId}:
 *   get:
 *     summary: Get try-on by ID
 *     description: Returns a single try-on record by its identifier.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tryonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Try-on identifier.
 *         example: b3e7d4dd-953b-4d42-aefe-d8d83e31394d
 *     responses:
 *       200:
 *         description: Try-on fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonRecord'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Try-on not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to fetch try-on.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/item/:tryonId', getTryOnByIdController);

/**
 * @swagger
 * /api/tryon/item/{tryonId}:
 *   delete:
 *     summary: Delete try-on by ID
 *     description: Deletes a try-on record by identifier.
 *     tags:
 *       - TryOn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tryonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Try-on identifier.
 *         example: b3e7d4dd-953b-4d42-aefe-d8d83e31394d
 *     responses:
 *       200:
 *         description: Try-on deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TryonRecord'
 *       401:
 *         description: Missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Try-on not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         description: Failed to delete try-on.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/item/:tryonId', deleteTryOnByIdController);

export default router;