import { Router } from 'express';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  getProductDetailsById,
  getProducts,
  getTopTrendingProducts,
} from '#src/controllers/product.controller.ts';

const router = Router();

router.get('/trending', getTopTrendingProducts);
router.get('/:productId', getProductDetailsById);

router.use(authMiddleware);

router.get('/product', getProducts);
router.get('/recomendations', () => console.log('hi'));

export default router;
