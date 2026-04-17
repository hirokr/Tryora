import { Router } from 'express';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  getProductDetailsById,
  updateProductAppearance,
} from '#src/controllers/product.controller.ts';
import { editProductImageAppearance } from '#src/controllers/productImageEdit.controller.ts';
import {
  editProductImageAppearanceSchema,
  updateProductAppearanceSchema,
} from '#src/validations/product.validation.ts';

const router = Router();

router.use(authMiddleware);

router.get('/:productId', getProductDetailsById);

router.patch('/:productId/appearance',
  validateRequest(updateProductAppearanceSchema),
  updateProductAppearance
);
// TODO: Remove this route once the trending products endpoint is implemented
router.get('/trending', getProductDetailsById);

router.post('/:productId/appearance/ai-edit',
  validateRequest(editProductImageAppearanceSchema),
  editProductImageAppearance
);


export default router;
