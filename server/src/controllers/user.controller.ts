import { AuthRequest } from '#src/types/authRequest.type.ts';
import { Request, Response } from 'express';
import prisma from '#src/config/database.ts';
import {
  findUserById,
  updateUserPassword,
  updateUserProfile,
  verifyUserEmail,
} from '#src/services/user.service.ts';
import { hashing, verifyHash } from '#src/utils/auth/hash.ts';
import { sendVerificationEmail } from '#src/utils/mail/sendMail.ts';
import { generateAccessToken } from '#src/utils/jwt/tokens.ts';
import { clearTokens } from '#src/utils/jwt/tokens.ts';
import { deleteCurrentRefreshToken } from '#src/services/token.service.ts';
import crypto from 'crypto';
import {
  ChangePasswordSchema,
  updateProfileSchema,
} from '#src/validations/user.validation.ts';

/**
 * Get the authenticated user's profile
 *
 * @param req - AuthRequest object containing the authenticated user's ID
 * @param res - Response object to send the user profile data
 * @returns JSON response with user profile information
 *
 * @example
 * GET /api/users/profile
 * Response: {
 *   id: "user-uuid",
 *   email: "user@example.com",
 *   name: "John Doe",
 *   avatarUrl: "https://...",
 *   emailVerified: true,
 *   isActive: true
 * }
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { passwordHash, oauthProvider, oauthId, deletedAt, ...userProfile } =
      user;
    return res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

/**
 * Update the authenticated user's profile
 *
 * @param req - AuthRequest with userId and request body containing fields to update:
 *   - name: string (optional) - User's new name
 *   - avatarUrl: string (optional) - User's new avatar URL
 * @param res - Response object to send confirmation
 * @returns JSON response with updated profile data
 *
 * @example
 * PUT /api/users/profile
 * Body: {
 *   name: "Jane Doe",
 *   avatarUrl: "https://..."
 * }
 * Response: {
 *   id: "user-uuid",
 *   email: "user@example.com",
 *   name: "Jane Doe",
 *   avatarUrl: "https://...",
 *   emailVerified: true,
 *   isActive: true
 * }
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const validData = updateProfileSchema.safeParse(req.body);
    if (!validData.success) {
      return res.status(400).json({
        message: validData.error.errors[0]?.message || 'Validation error',
        errors: validData.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await updateUserProfile({
      userId: req.userId,
      ...validData.data,
    });

    return res
      .status(200)
      .json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Failed to update user profile' });
  }
};

/**
 * Change the authenticated user's password
 *
 * @param req - AuthRequest with userId and request body containing:
 *   - currentPassword: string - User's current password for verification
 *   - newPassword: string - User's new password
 *   - confirmPassword: string - Confirmation of new password (must match newPassword)
 * @param res - Response object to send confirmation
 * @returns JSON success/error message
 *
 * @example
 * POST /api/users/change-password
 * Body: {
 *   currentPassword: "old_password123",
 *   newPassword: "new_password456",
 *   confirmPassword: "new_password456"
 * }
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    // Validate input using Zod schema
    const parsedData = ChangePasswordSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: parsedData.error.errors[0]?.message || 'Validation error',
        errors: parsedData.error.flatten().fieldErrors,
      });
    }
    const { currentPassword, newPassword } = parsedData.data;

    // Fetch user
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.passwordHash) {
      return res
        .status(400)
        .json({ message: 'User account does not have a password set' });
    }

    // Verify current password
    const isPasswordValid = await verifyHash(
      user.passwordHash,
      currentPassword
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedNewPassword = await hashing(newPassword);
    await updateUserPassword(req.userId, hashedNewPassword);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

/**
 * Reset user password using a password reset token
 *
 * @param req - Request with query/body containing:
 *   - token: string - Password reset token (from email link)
 *   - newPassword: string - New password
 *   - confirmPassword: string - Confirmation of new password
 * @param res - Response object to send confirmation
 * @returns JSON success/error message
 *
 * @example
 * POST /api/users/reset-password
 * Body: {
 *   token: "reset_token_from_email",
 *   newPassword: "new_password456",
 *   confirmPassword: "new_password456"
 * }
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: 'Token and password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash the token to find it in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Check if reset token exists and is valid (you would need to add this to your schema)
    // For now, this is a placeholder - you should implement token validation
    // This requires adding password reset tokens to your Prisma schema

    // TODO: Implement password reset token validation in database
    // Should check if token exists, hasn't expired, and is marked as used
    // Then update user password and mark token as used

    return res.status(501).json({
      message: 'Password reset functionality requires token table in database',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

/**
 * Verify user's email address using verification token
 *
 * @param req - Request with query/body containing:
 *   - token: string - Email verification token from email link
 * @param res - Response object to send confirmation
 * @returns JSON success/error message
 *
 * @example
 * POST /api/users/verify-email
 * Body: {
 *   token: "verification_token_from_email"
 * }
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: 'Verification token is required' });
    }

    // Hash the token to find it in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // TODO: Implement email verification token validation
    // Should check if token exists, hasn't expired, find associated user
    // Then verify user email using verifyUserEmail service

    return res
      .status(501)
      .json({ message: 'Email verification requires token table in database' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
};

/**
 * Resend verification email to authenticated user
 *
 * @param req - AuthRequest object containing the authenticated user's ID
 * @param res - Response object to send confirmation
 * @returns JSON success/error message
 *
 * @example
 * POST /api/users/resend-verification-email
 * Response: {
 *   message: "Verification email sent successfully"
 * }
 */
export const resendVerificationEmail = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch user
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // TODO: Save token to database with expiration
    // await prisma.emailVerificationToken.create({
    //   data: {
    //     token: hashedToken,
    //     userId: req.user.userId,
    //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    //   },
    // });

    // Build verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    // TODO: add a opt to include expiration time in email content
    // await sendVerificationEmail({
    //   to: user.email,
    //   userName: user.name,
    //   verificationLink,
    //   otpCode: '',
    //   expiryMinutes: 1440, // 24 hours
    // });

    return res
      .status(200)
      .json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return res
      .status(500)
      .json({ message: 'Failed to send verification email' });
  }
};

/**
 * Delete the authenticated user's account
 *
 * @param req - AuthRequest with userId and optional body containing:
 *   - password: string - User's password for additional security verification
 * @param res - Response object to send confirmation
 * @returns JSON success/error message
 *
 * @example
 * DELETE /api/users/account
 * Body: {
 *   password: "user_password123"
 * }
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { password } = req.body;

    // Validate password for account deletion
    if (!password) {
      return res
        .status(400)
        .json({ message: 'Password is required to delete account' });
    }

    // Fetch user
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(400).json({
        message: 'Cannot delete account without password verification',
      });
    }

    const isPasswordValid = await verifyHash(user.passwordHash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Soft delete: mark account as deleted
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Clear all refresh tokens for this user
    await deleteCurrentRefreshToken(req.userId);

    // Clear authentication cookies
    clearTokens(res);

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
};
