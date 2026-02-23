import {
  changePassword,
  deleteAccount,
  forgotPassword,
  getProfile,
  resendVerificationEmail,
  resetPassword,
  updateProfile,
  verifyEmail,
} from '#src/controllers/user.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

// Public routes
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);

// All routes below this middleware require authentication
router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.post('/change-password', changePassword);

router.delete('/delete-account', deleteAccount);

export default router;
