import { Router } from 'express';
import {
  addFavoriteProduct,
  getProductDetailsById,
  getProducts,
  getTopTrendingProducts,
  likeProduct,
  // removeFavoriteProduct,
  searchProductsByQuery,
  // unlikeProduct,
} from '#src/controllers/product.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';

const router = Router();

router.get('/discover', getTopTrendingProducts);
router.get('/', getProducts);
router.get('/:productId', getProductDetailsById);
router.post('/search-filter', searchProductsByQuery);

router.use(authMiddleware);

router.post('/like/:productId', likeProduct);
router.post('/favourite/:productId', addFavoriteProduct);

// router.post('/unlike/:productId', unlikeProduct);

// router.post('/remove-favorite/:productId', removeFavoriteProduct);
router.post('/search-filter', searchProductsByQuery);

router.use(authMiddleware);

router.post('/like/:productId', likeProduct);

router.post('/favourite/:productId', addFavoriteProduct);

// router.post('/unlike/:productId', unlikeProduct);

// router.post('/remove-favorite/:productId', removeFavoriteProduct);

export default router;
