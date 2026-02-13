import {
  changePassword,
  deleteAccount,
  getProfile,
  resendVerificationEmail,
  resetPassword,
  updateProfile,
  verifyEmail,
} from '#src/controllers/user.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.post('/change-password', changePassword);
router.post('/reset-password', resetPassword);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);

router.delete('/delete-account', deleteAccount);

export default router;
