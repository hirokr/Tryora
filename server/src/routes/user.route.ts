import {
  changePassword,
  deleteAccount,
  forgotPassword,
  getFavoriteProducts,
  getLikedProducts,
  getProfile,
  resendVerificationEmail,
  resetPassword,
  updateUserProfileData,
  verifyEmail,
} from '#src/controllers/user.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User account management endpoints including profile, password, verification, and account deletion.
 */

// Public routes
/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset password with verification token
 *     description: Resets a user password using a valid reset token and matching new password fields.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token sent to the user email.
 *                 example: c8d4d08a2f0d4f30a4b8ec4e693c99f4
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewP@ssword1
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewP@ssword1
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid payload, token, or mismatched passwords
 *       500:
 *         description: Failed to reset password
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     description: Accepts an email and triggers password reset flow if the account exists.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *     responses:
 *       200:
 *         description: Reset flow accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If that email is registered, a reset link has been sent
 *       400:
 *         description: Email is missing
 *       500:
 *         description: Failed to process forgot password request
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/user/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Verifies user email using token and user ID.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - userId
 *             properties:
 *               token:
 *                 type: string
 *                 example: 4a3ef8876fba4d9bb95d0f1733b6b80c
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: 67ce50cb-6613-4ef1-bce8-809aabf6850f
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token or userId missing
 *       500:
 *         description: Failed to verify email
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/user/resend-verification-email:
 *   post:
 *     summary: Resend verification email
 *     description: Sends a new verification email for the currently authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email already verified
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to send verification email
 */
router.post('/resend-verification-email', resendVerificationEmail);

// All routes below this middleware require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile without sensitive fields.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user profile
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /api/user/me:
 *   patch:
 *     summary: Update basic profile fields
 *     description: Updates profile fields such as name and avatar URL for the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: Jane Doe
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to update user profile
 */
router.patch('/me', updateUserProfileData);

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change current password
 *     description: Changes the authenticated user's password after validating the current password.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldP@ssword1
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewP@ssword1
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewP@ssword1
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or password not set for account
 *       401:
 *         description: User not authenticated or current password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to change password
 */
router.post('/change-password', changePassword);

/**
 * @swagger
 * /api/user/delete-account:
 *   delete:
 *     summary: Soft-delete current account
 *     description: Marks the authenticated account as deleted and clears sessions/tokens.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: CurrentP@ssword1
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Password missing or account cannot be deleted without verification
 *       401:
 *         description: User not authenticated or password incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete account
 */
router.delete('/delete-account', deleteAccount);

router.get('/get-favorites', getFavoriteProducts);

router.get('/get-liked-products', getLikedProducts);

export default router;
