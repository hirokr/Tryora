import { AuthRequest } from '#src/types/authRequest.js';
import { Request, Response } from 'express';
import {
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  getFavoriteProductsDB,
  getLikedProductsDB,
  updateUserPassword,
  updateUserProfile,
  verifyUserEmail,
} from '#src/services/user.service.ts';
import { hashing, verifyHash } from '#src/utils/auth/hash.ts';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '#src/utils/mail/sendMail.ts';
import {
  createRandomToken,
  generateAccessToken,
} from '#src/utils/jwt/tokens.ts';
import { clearTokens } from '#src/utils/jwt/tokens.ts';
import {
  deleteAllRefreshTokens,
  deleteCurrentRefreshToken,
} from '#src/services/token.service.ts';
import {
  ChangePasswordSchema,
  updateProfileSchema,
} from '#src/validations/user.validation.ts';
import { deleteUserCache } from '#src/utils/redis.ts';

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
    return res.status(200).json({
      user: userProfile,
    });
  } catch (error) {
    //  console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

export const updateUserProfileData = async (
  req: AuthRequest,
  res: Response
) => {
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
    // console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Failed to update user profile' });
  }
};

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
    // console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // For security, do not reveal that the email is not registered
      return res.status(200).json({
        message: 'If that email is registered, a reset link has been sent',
      });
    }

    // Generate password reset token (valid for 1 hour)
    const resetToken = createRandomToken();

    await updateUserProfile({ userId: user.id, verificationToken: resetToken });

    sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      verificationLink: '',
      expiryMinutes: 60,
    });
  } catch (error) {
    // console.error('Error in forgot password:', error);
    return res
      .status(500)
      .json({ message: 'Failed to process forgot password request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

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

    const user = await findUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password and update it in the database
    const newPasswordHash = await hashing(newPassword);
    await updateUserPassword(user.id, newPasswordHash);

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    // console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res
        .status(400)
        .json({ message: 'Verification token and user ID are required' });
    }

    await verifyUserEmail(userId, token);

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    // console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
};

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
    const newToken = createRandomToken();

    // TODO: Save token to database with expiration
    await updateUserProfile({
      userId: req.userId,
      verificationToken: newToken,
    });

    // Build verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}`;

    await sendVerificationEmail({
      to: user.email,
      userName: user.name,
      verificationLink,
      otpCode: '',
      expiryMinutes: 1440, // 24 hours
    });

    return res
      .status(200)
      .json({ message: 'Verification email sent successfully' });
  } catch (error) {
    // console.error('Error resending verification email:', error);
    return res
      .status(500)
      .json({ message: 'Failed to send verification email' });
  }
};

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
    await updateUserProfile({
      userId: req.userId,
      deletedAt: new Date(),
      isActive: false,
    });

    // Clear all refresh tokens for this user
    await deleteAllRefreshTokens(req.userId);

    // Delete all the user's cache entries (sessions, profile, etc.)
    await deleteUserCache(req.userId);

    // Clear authentication cookies
    clearTokens(res);

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    // console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
};

export const getFavoriteProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { limit = 20, skip = 0 } = req.query as {
      limit?: string;
      skip?: string;
    };

    const products = await getFavoriteProductsDB(
      req.userId,
      Number(limit),
      Number(skip)
    );
    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'success',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch favorite products',
    });
  }
};

export const getLikedProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { limit = 20, skip = 0 } = req.query as {
      limit?: string;
      skip?: string;
    };

    const products = await getLikedProductsDB(
      req.userId,
      Number(limit),
      Number(skip)
    );
    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'success',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch liked products',
    });
  }
};
