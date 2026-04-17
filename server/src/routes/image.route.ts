import { Router } from 'express';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  createTryOnFromProducts,
  getUserTryOnImageByIdHandler,
  getUserTryOnImagesPaginated,
} from '#src/controllers/image.controller.ts';
import { createTryOnImagesSchema } from '../validations/image.validation.ts';

const router = Router();

router.use(authMiddleware);

router.get('/images/previous-try-ons', getUserTryOnImagesPaginated);
router.get(
  '/images/previous-try-ons/:tryonResultId',
  getUserTryOnImageByIdHandler
)

router.post(
  '/images/try-on',
  validateRequest(createTryOnImagesSchema),
  createTryOnFromProducts
);

export default router;
