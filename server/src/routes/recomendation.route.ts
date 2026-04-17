import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { getRuntimeProductRecommendations } from '#src/controllers/recommendation.controller.ts';

const router = Router();

router.use(authMiddleware);
router.get('/', getRuntimeProductRecommendations);

export default router;
