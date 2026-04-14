import {
  getProductsById,
  getProductsBySearchId,
  getUserSearchHistory,
  searchProducts,
} from '#src/controllers/search.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/search', searchProducts);
router.get('/history', getUserSearchHistory);
router.get('/:searchId/products', getProductsBySearchId);
router.get('/product/:productId', getProductsById);

export default router;
