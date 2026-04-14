import {
  getUserProfile,
  setUserPreferences,
  updateUserPreferences,
  uploadBodyImages,
} from '#src/controllers/Profile.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/body-images', uploadBodyImages);
router.post('/preferences', setUserPreferences);
router.get('/profile', getUserProfile);
router.patch('/preferences', updateUserPreferences);
