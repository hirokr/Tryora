import { Request, Response } from 'express';
import passport from 'passport';
import '../config/google.config.ts';
import { createUser, findUserByEmail } from '#src/services/user.service.ts';
import { hashPassword } from '#src/utils/jwt/hashPassword.ts';
import { ReturnUserDto } from '#src/services/dto/createUser.dto.ts';

export const refresh = async (req: Request, res: Response) => {
  return 'refresh token';

  res.status(200).json({ message: 'Token refreshed' });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: 'Email, password and name are required' });
    }

    const user = await findUserByEmail(email);
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser: ReturnUserDto = await createUser({
      ...req.body,
      password: hashedPassword,
    });

    // TODO: Send verification email here

    res
      .status(201)
      .json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ message: 'user creation failed' });
  }
};

export const signin = async (req: Request, res: Response) => {
  return 'refresh token';

  res.status(200).json({ message: 'Token refreshed' });
};

export const signout = async (req: Request, res: Response) => {
  return 'refresh token';

  res.status(200).json({ message: 'Token refreshed' });
};

// @desc    Initiate Google OAuth2 login
// @route   GET /auth/google
export const googleAuth = async (req: Request, res: Response) => {
  passport.authenticate('google', { scope: ['email', 'profile'] })(req, res);
};

// @desc    Handle Google OAuth2 callback
// @route   GET /auth/google/callback
export const googleAuthCallback = async (req: Request, res: Response) => {
  passport.authenticate('google', {
    successRedirect: '/auth/secret',
    failureRedirect: '/auth/google/failure',
  })(req, res);
};

// @desc    Google OAuth2 failure route
// @route   GET /auth/google/failure
export const googleAuthFailure = async (req: Request, res: Response) => {
  res.send('Failed to authenticate..');
};

export const logout = async (req: Request, res: Response) => {
  return 'logout';
  res.status(200).json({ message: 'Logged out successfully' });
};

// todo:
// ! Implement password reset flow
// ? Implement email verification flow
// * main implementation
//  //
