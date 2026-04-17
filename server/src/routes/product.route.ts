import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  getProductDetailsById,
  getProducts,
  getTopTrendingProducts,
} from '#src/controllers/product.controller.ts';

const router = Router();

router.use(authMiddleware);

router.get('/:productId', getProductDetailsById);
router.get('/product', getProducts);

router.get('/trending', getTopTrendingProducts);

export default router;
