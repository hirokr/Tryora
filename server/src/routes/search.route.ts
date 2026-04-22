import {
  getProductsBySearchId,
  getUserSearchHistory,
  searchProducts,
  // updateProductMetrics,
} from '#src/controllers/search.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/search', searchProducts);
router.get('/history', getUserSearchHistory);
router.get('/:searchId/products', getProductsBySearchId);

// router.post('/product-metric/:productId', updateProductMetrics);

export default router;
