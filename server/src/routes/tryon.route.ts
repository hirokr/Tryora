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
import {
  discoverTryOns,
  getPublicTryOnByIdController,
  getTryOnsByUserIdController,
} from '#src/controllers/tryon.controller.ts';
import { generateModelTryon, getUserGeneratedModels } from '#src/controllers/model.controller.ts';
import { getTryonJobStatus } from '#src/controllers/job.controller.ts';

const router = Router();

router.get('/public/:tryonId', getPublicTryOnByIdController);

router.use(authMiddleware);

router.get('/jobs/:jobId', getTryonJobStatus);

router.get(`/trending`, discoverTryOns);

router.post(`/model/generate`, generateModelTryon);

router.post(`/image/generate`, fuseProductImages);

router.post('/image/edit', updateProductAppearance);

router.get(`/user/:userId`, getTryOnsByUserIdController);

router.get('/models/user', getUserGeneratedModels);

router.get('/item/:tryonId', getTryOnById);

router.delete('/item/:tryonId', deleteTryOn);

export default router;