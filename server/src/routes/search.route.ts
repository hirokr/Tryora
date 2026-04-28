import {
  getProductsBySearchId,
  getUserSearchHistory,
  searchProducts,
  // updateProductMetrics,
} from '#src/controllers/search.controller.ts'; //// Imports logic handlers from the controller
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts'; //// Middleware to verify JWT/user session
import { Router } from 'express';  //// Express utility to create modular, mountable route handlers

const router = Router();



router.use(authMiddleware);

router.post('/search', searchProducts);
router.get('/history', getUserSearchHistory);
router.get('/:searchId/products', getProductsBySearchId);

// router.post('/product-metric/:productId', updateProductMetrics);

export default router;
