import { Router } from 'express';
import {
  googleAuth,
  googleAuthCallback,
  googleAuthFailure,
  refresh,
  signin,
  signout,
  signup,
} from '#src/controllers/auth.controller.ts';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  SigninFormSchema,
  SignupFormSchema,
} from '#src/validations/auth.validation.ts';

const router = Router();

// Google OAuth2 routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.get('/google/failure', googleAuthFailure);

// TODO: Impement facebook and github auth routes

// Local auth routes
router.post('/signup', validateRequest(SignupFormSchema), signup);
router.post('/signin', validateRequest(SigninFormSchema), signin);

// Get new access token using refresh token
router.get('/refresh', refresh);

// Implement signout route
router.get('/signout', authMiddleware, signout);

export default router;
