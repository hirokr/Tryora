import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  fuseProductImages,
  updateProductAppearance,
} from '#src/controllers/image.controller.ts';
import { deleteTryOn, getTryOnById } from '#src/services/tryon.service.ts';

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
router.get(`/:jobId`, placeHolder);

// discover tryons
router.get(`/discover`, placeHolder);

//todo: create actul generation controller and remove this placeholder route
// 3D model generation route
router.post(`model/generate`, placeHolder);

// image router
router.post(`image/generate`, fuseProductImages);
router.post('/image/edit', updateProductAppearance);

// get users tryon params={image or model}
router.get(`/user/:userId`, placeHolder);

router.get(`/:tryonId`, getTryOnById);

router.delete(`/:tryonId`, deleteTryOn);

export default router;
