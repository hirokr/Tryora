import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  delete3DModelByTryonResultId,
  get3DGenerationJobStatus,
  get3DModelByTryonResultId,
  request3DModelGeneration,
} from '#src/controllers/3dmodel.controller.ts';

const router = Router();
const MODEL_ROUTE_BASE = '/3d';
const JOB_ROUTE_BASE = '/jobs';

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: 3D Models
 *     description: |
 *       Endpoints for generating, tracking, retrieving, and deleting user-specific 3D model outputs
 *       from try-on results.
 *
 *       These routes are protected and require a valid Bearer access token.
 *
 *       Typical workflow:
 *       1. Submit a generation request with `POST /api/3d/generate`.
 *       2. Poll status through `GET /api/jobs/{jobId}`.
 *       3. Retrieve generated asset using `GET /api/3d/{tryonResultId}`.
 *       4. Remove generated model using `DELETE /api/3d/{tryonResultId}` if needed.
 */
// HI
/**
 * @swagger
 * /api/3d/generate:
 *   post:
 *     summary: Queue 3D model generation for a try-on result
 *     description: |
 *       Creates a MODEL_3D_GENERATION job for the authenticated user and returns an asynchronous job ID.
 *
 *       Validation and behavior:
 *       - Requires `tryonResultId` in the request body.
 *       - The referenced try-on result must belong to the authenticated user and not be soft-deleted.
 *       - If a model already exists for that try-on result, no new job is created and HTTP 409 is returned.
 *       - Optional `prompt` is accepted and passed to the downstream generation pipeline.
 *
 *       This endpoint is asynchronous by design and returns job metadata when accepted.
 *     tags:
 *       - 3D Models
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tryonResultId
 *             properties:
 *               tryonResultId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of an existing try-on result owned by the current user.
 *                 example: 8af2c672-6c59-4dbf-9a62-f45454ad46ad
 *               prompt:
 *                 type: string
 *                 description: Optional free-form instruction appended to generation input.
 *                 example: Generate a clean high-detail mesh suitable for product spin preview.
 *     responses:
 *       202:
 *         description: Job accepted and queued for processing
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
 *                   description: Server-side generation job identifier for polling.
 *                   example: dc48f0cc-bad5-45bb-b6f3-5dc69e6f0af2
 *                 status:
 *                   type: string
 *                   enum: [QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *                   description: Initial status at creation time (typically QUEUED).
 *                   example: QUEUED
 *       400:
 *         description: Missing or invalid request body fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: tryonResultId is required
 *       401:
 *         description: Unauthorized request (missing or invalid access token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Referenced try-on result was not found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: TryonResult not found
 *       409:
 *         description: A 3D model already exists for the try-on result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - glbUrl
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 3D model already generated
 *                 glbUrl:
 *                   type: string
 *                   format: uri
 *                   description: Existing generated GLB URL for the try-on result.
 *                   example: https://cdn.tryora.ai/3d/8af2c672.glb
 *       500:
 *         description: Internal server error while enqueueing 3D generation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to enqueue 3D model job
 */
router.post(`${MODEL_ROUTE_BASE}/generate`, request3DModelGeneration);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Fetch current 3D generation job status
 *     description: |
 *       Returns the latest status snapshot for a job owned by the authenticated user.
 *
 *       Notes:
 *       - Use this endpoint for polling after calling `POST /api/3d/generate`.
 *       - `jobType` is expected to be `MODEL_3D_GENERATION` for jobs created by the 3D endpoint.
 *       - `tryonResultId` is populated only after successful completion and relation resolution.
 *     tags:
 *       - 3D Models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the generation job to inspect.
 *         example: dc48f0cc-bad5-45bb-b6f3-5dc69e6f0af2
 *     responses:
 *       200:
 *         description: Job status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - id
 *                 - jobType
 *                 - status
 *                 - progress
 *                 - createdAt
 *                 - retryCount
 *                 - tryonResultId
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: dc48f0cc-bad5-45bb-b6f3-5dc69e6f0af2
 *                 jobType:
 *                   type: string
 *                   enum: [TRYON_GENERATION, MODEL_3D_GENERATION]
 *                   example: MODEL_3D_GENERATION
 *                 status:
 *                   type: string
 *                   enum: [QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *                   example: PROCESSING
 *                 progress:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 100
 *                   description: Percentage-like progress reported by the pipeline.
 *                   example: 67
 *                 currentStage:
 *                   type: string
 *                   nullable: true
 *                   description: Human-readable stage label from processing pipeline.
 *                   example: meshing
 *                 outputGlbUrl:
 *                   type: string
 *                   format: uri
 *                   nullable: true
 *                   description: Final generated GLB asset URL (only present on completion).
 *                   example: https://cdn.tryora.ai/3d/8af2c672.glb
 *                 outputImageUrl:
 *                   type: string
 *                   format: uri
 *                   nullable: true
 *                   description: Final generated image URL for image-edit style jobs.
 *                   example: https://cdn.tryora.ai/images/edited-product.png
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                   description: Failure diagnostic if status is FAILED.
 *                   example: Third-party provider timeout while fetching final model.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-04-14T09:14:23.000Z
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: 2026-04-14T09:14:27.000Z
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: 2026-04-14T09:16:03.000Z
 *                 retryCount:
 *                   type: integer
 *                   minimum: 0
 *                   description: Number of retries consumed so far.
 *                   example: 1
 *                 tryonResultId:
 *                   type: string
 *                   format: uuid
 *                   nullable: true
 *                   description: Associated try-on result once completion relation is available.
 *                   example: 8af2c672-6c59-4dbf-9a62-f45454ad46ad
 *                 productId:
 *                   type: string
 *                   format: uuid
 *                   nullable: true
 *                   description: Associated product identifier for product image edit jobs.
 *                   example: 5d3dc830-6a2f-4389-b13f-2030fa1d65a9
 *             examples:
 *               processing:
 *                 summary: Job in progress
 *                 value:
 *                   id: dc48f0cc-bad5-45bb-b6f3-5dc69e6f0af2
 *                   jobType: MODEL_3D_GENERATION
 *                   status: PROCESSING
 *                   progress: 67
 *                   currentStage: meshing
 *                   outputGlbUrl: null
 *                   errorMessage: null
 *                   createdAt: 2026-04-14T09:14:23.000Z
 *                   startedAt: 2026-04-14T09:14:27.000Z
 *                   completedAt: null
 *                   retryCount: 0
 *                   tryonResultId: null
 *               completed:
 *                 summary: Job completed
 *                 value:
 *                   id: dc48f0cc-bad5-45bb-b6f3-5dc69e6f0af2
 *                   jobType: MODEL_3D_GENERATION
 *                   status: COMPLETED
 *                   progress: 100
 *                   currentStage: done
 *                   outputGlbUrl: https://cdn.tryora.ai/3d/8af2c672.glb
 *                   errorMessage: null
 *                   createdAt: 2026-04-14T09:14:23.000Z
 *                   startedAt: 2026-04-14T09:14:27.000Z
 *                   completedAt: 2026-04-14T09:16:03.000Z
 *                   retryCount: 0
 *                   tryonResultId: 8af2c672-6c59-4dbf-9a62-f45454ad46ad
 *       400:
 *         description: Missing or invalid path parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: jobId is required
 *       401:
 *         description: Unauthorized request (missing or invalid access token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Job not found for current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       500:
 *         description: Internal server error while fetching job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch job status
 */
router.get(`${JOB_ROUTE_BASE}/:jobId`, get3DGenerationJobStatus);

/**
 * @swagger
 * /api/3d/{tryonResultId}:
 *   get:
 *     summary: Retrieve generated 3D model URL by try-on result ID
 *     description: |
 *       Returns generated model metadata for the specified try-on result belonging to the authenticated user.
 *
 *       Response modes:
 *       - 200 when model is ready (`glbUrl` present).
 *       - 202 when model is not ready yet, optionally including job progress if a generation job exists.
 *       - 404 when try-on result does not exist for the user.
 *     tags:
 *       - 3D Models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tryonResultId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the try-on result to inspect.
 *         example: 8af2c672-6c59-4dbf-9a62-f45454ad46ad
 *     responses:
 *       200:
 *         description: Generated 3D model is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - glbUrl
 *                 - jobId
 *               properties:
 *                 glbUrl:
 *                   type: string
 *                   format: uri
 *                   description: Public or signed URL to the generated GLB file.
 *                   example: https://cdn.tryora.ai/3d/8af2c672.glb
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                   nullable: true
 *                   description: Job ID that produced this GLB.
 *                   example: dc48f0cc-bad5-45bb-b6f3-5dc69e6f0af2
 *       202:
 *         description: 3D model generation is still in progress or not started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - job
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 3D model is not ready yet
 *                 job:
 *                   type: object
 *                   nullable: true
 *                   required:
 *                     - status
 *                     - progress
 *                     - currentStage
 *                     - errorMessage
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *                       example: PROCESSING
 *                     progress:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 42
 *                     currentStage:
 *                       type: string
 *                       nullable: true
 *                       example: texturing
 *                     errorMessage:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *             examples:
 *               pending-with-job:
 *                 summary: Generation running with known job progress
 *                 value:
 *                   message: 3D model is not ready yet
 *                   job:
 *                     status: PROCESSING
 *                     progress: 42
 *                     currentStage: texturing
 *                     errorMessage: null
 *               pending-no-job:
 *                 summary: No generation job linked yet
 *                 value:
 *                   message: 3D model is not ready yet
 *                   job: null
 *       400:
 *         description: Missing or invalid path parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: tryonResultId is required
 *       401:
 *         description: Unauthorized request (missing or invalid access token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Try-on result not found for current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: TryonResult not found
 *       500:
 *         description: Internal server error while fetching model status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch 3D model
 */
router.get(`${MODEL_ROUTE_BASE}/:tryonResultId`, get3DModelByTryonResultId);

/**
 * @swagger
 * /api/3d/{tryonResultId}:
 *   delete:
 *     summary: Delete generated 3D model association for a try-on result
 *     description: |
 *       Removes the generated GLB association for the specified try-on result owned by the authenticated user.
 *
 *       Current behavior:
 *       - Clears `glbUrl` and `glbJobId` from the try-on result.
 *       - Clears matching `outputGlbUrl` from related generation job records.
 *       - Does not delete the original try-on result entry.
 *     tags:
 *       - 3D Models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tryonResultId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the target try-on result.
 *         example: 8af2c672-6c59-4dbf-9a62-f45454ad46ad
 *     responses:
 *       200:
 *         description: Model association removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 3D model removed successfully
 *       400:
 *         description: Missing or invalid path parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: tryonResultId is required
 *       401:
 *         description: Unauthorized request (missing or invalid access token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Try-on result not found or no generated 3D model exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               tryon-missing:
 *                 summary: Try-on result is missing
 *                 value:
 *                   message: TryonResult not found
 *               no-model:
 *                 summary: Try-on result exists but has no 3D model
 *                 value:
 *                   message: No generated 3D model found
 *       500:
 *         description: Internal server error while deleting generated model
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to delete 3D model
 */
router.delete(
  `${MODEL_ROUTE_BASE}/:tryonResultId`,
  delete3DModelByTryonResultId
);

export default router;
