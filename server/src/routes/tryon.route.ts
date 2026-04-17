import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  fuseProductImages,
  updateProductAppearance,
} from '#src/controllers/image.controller.ts';
import {
  deleteTryOn,
  getTryOnById,
  getTryOnsByUserId,
} from '#src/services/tryon.service.ts';
import { discoverTryOns } from '#src/controllers/tryon.controller.ts';
import { generateModelTryon } from '#src/controllers/model.controller.ts';
import { getJobById } from '#src/services/job.service.ts';

const router = Router();
/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User account management endpoints including profile, password, verification, and account deletion.
 */
router.use(authMiddleware);

// get the jobs
router.get(`/:jobId`, getJobById);

// discover tryons
router.get(`/discover`, discoverTryOns);

// 3D model generation route
router.post(`model/generate`, generateModelTryon);

// image router
router.post(`image/generate`, fuseProductImages);
router.post('/image/edit', updateProductAppearance);

// get users tryon params={image or model}
router.get(`/user/:userId`, getTryOnsByUserId);

router.get(`/:tryonId`, getTryOnById);

router.delete(`/:tryonId`, deleteTryOn);

export default router;
