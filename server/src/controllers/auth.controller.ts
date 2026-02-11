import { Request, Response } from 'express';
import passport from 'passport';
import '../config/google.config.ts';
import { createUser, findUserByEmail } from '#src/services/user.service.ts';

import { ReturnUserDto } from '#src/services/dto/createUser.dto.ts';
import { generateTokens } from '#src/utils/jwt/tokens.ts';
import { saveRefreshToken, saveToCookie } from '#src/services/token.service.ts';
import { saveUserSession } from '#src/services/session.service.ts';
import { hashing, verifyHash } from '#src/utils/auth/hash.ts';

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

    const hashedPassword = await hashing(password);

    const newUser: ReturnUserDto = await createUser({
      ...req.body,
      passwordHash: hashedPassword,
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
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const isPasswordValid = await verifyHash(
    user.passwordHash as string,
    password
  );
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const { accessToken, refreshToken } = await generateTokens(user.id);
  const hashedRefreshToken = await hashing(refreshToken);

  await saveRefreshToken(user.id, hashedRefreshToken);

  await saveUserSession(user.id, req.sessionID, req.get('user-agent'), req.ip);

  await saveToCookie(res, hashedRefreshToken, accessToken);

  const secureUser: ReturnUserDto = user;

  res.status(200).json({ message: 'Signin successful', user: secureUser });
};

export const signout = async (req: Request, res: Response) => {
  req.logout(err => {
    if (err) return res.sendStatus(500);
    req.session.destroy(err => {
      res.send('Signout Success!');
    });
  });
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

// todo:
// ! Implement password reset flow
// ? Implement email verification flow
// * main implementation
//  //
