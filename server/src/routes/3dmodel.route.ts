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

router.post(`${MODEL_ROUTE_BASE}/generate`, request3DModelGeneration);

router.get(`${JOB_ROUTE_BASE}/:jobId`, get3DGenerationJobStatus);

router.get(`${MODEL_ROUTE_BASE}/:tryonResultId`, get3DModelByTryonResultId);

router.delete(
  `${MODEL_ROUTE_BASE}/:tryonResultId`,
  delete3DModelByTryonResultId
);

export default router;
