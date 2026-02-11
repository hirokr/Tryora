import { Request, Response } from 'express';

export const getProfile = async (req: Request, res: Response) => {
  return 'get profile';

  res.status(200).json({ message: 'User profile data' });
};

export const updateProfile = async (req: Request, res: Response) => {
  return 'update profile';

  res.status(200).json({ message: 'User profile updated' });
};

export const changePassword = async (req: Request, res: Response) => {
  return 'change password';

  res.status(200).json({ message: 'Password changed successfully' });
};

export const resetPassword = async (req: Request, res: Response) => {
  return 'reset password';

  res.status(200).json({ message: 'Password reset successfully' });
};

export const verifyEmail = async (req: Request, res: Response) => {
  return 'verify email';

  res.status(200).json({ message: 'Email verified successfully' });
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  return 'resend verification email';

  res.status(200).json({ message: 'Verification email resent' });
};

export const deleteAccount = async (req: Request, res: Response) => {
  return 'delete account';

  res.status(200).json({ message: 'Account deleted successfully' });
};
