import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  delete3DModelByTryonResultId,
  get3DGenerationJobStatus,
  get3DModelByTryonResultId,
  request3DModelGeneration,
} from '#src/controllers/3dmodel.controller.ts';

const router = Router();
/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User account management endpoints including profile, password, verification, and account deletion.
 */
const placeHolder = () => console.log('hi');
router.use(authMiddleware);

// get the jobs
router.get(`/:jobId`, get3DGenerationJobStatus);

// discover tryons
router.get(`/discover`, placeHolder);

//todo: create actul generation controller and remove this placeholder route
// 3D model generation route
router.post(`model/generate`, request3DModelGeneration);

// image router
router.post(`image/generate`, placeHolder);
router.post('/image/edit', placeHolder);

router.get(`/:tryonResultId`, get3DModelByTryonResultId);

router.delete(`/:tryonResultId`, delete3DModelByTryonResultId);

export default router;
