import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  getProductDetailsById,
  getProducts,
  getTopTrendingProducts,
} from '#src/controllers/product.controller.ts';

const router = Router();

router.get('/trending', getTopTrendingProducts);
router.get('/product', authMiddleware, getProducts);
router.get('/:productId', authMiddleware, getProductDetailsById);

export default router;
