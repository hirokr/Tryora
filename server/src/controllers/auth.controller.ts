import { Request, Response } from 'express';
import passport from 'passport';
import '../config/google.config.ts';
import {
  createUser,
  findUserByEmail,
  findUserById,
} from '#src/services/user.service.ts';

import { ReturnUserDto } from '#src/services/dto/createUser.dto.ts';
import {
  clearTokens,
  generateTokens,
  hashTokenCrypto,
  saveToCookie,
  verifyRefreshToken,
} from '#src/utils/jwt/tokens.ts';
import {
  deleteUserRefreshTokens,
  findRefreshToken,
  saveRefreshToken,
} from '#src/services/token.service.ts';
// todo: implement session management and session store
import { saveUserSession } from '#src/services/session.service.ts';
import { hashing, verifyHash } from '#src/utils/auth/hash.ts';
import { AuthRequest } from '#src/types/authRequest.type.ts';

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  const userId: string | null = await verifyRefreshToken(refreshToken);
  if (!userId) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const hashRT = hashTokenCrypto(refreshToken);
  const storedToken = await findRefreshToken(hashRT);

  if (!storedToken) {
    return res.status(401).json({ message: 'Refresh token not found' });
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateTokens(userId);

  const hashedRefreshToken = hashTokenCrypto(newRefreshToken);
  await saveRefreshToken(userId, hashedRefreshToken);

  await saveToCookie(res, newRefreshToken, accessToken);
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
  const hashedRefreshToken = hashTokenCrypto(refreshToken);

  await saveRefreshToken(user.id, hashedRefreshToken);

  // TODO: Save session info (user agent, IP) in the database for active session management
  // ? Save session info in the database for active session management
  // await saveUserSession(user.id, req.sessionID, req.get('user-agent'), req.ip);

  await saveToCookie(res, refreshToken, accessToken);

  const secureUser: ReturnUserDto = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatarUrl || undefined,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
  };

  res.status(200).json({ message: 'Signin successful', user: secureUser });
};

// @desc    Signout user and invalidate refresh token
// @route   GET /auth/signout
export const signout = async (req: AuthRequest, res: Response) => {
  const { userId } = req;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await deleteUserRefreshTokens(userId); // Invalidate all refresh tokens for the user
  await clearTokens(res); // Clear cookies

  req.logout(err => {
    if (err) return res.sendStatus(500);
    req.session.destroy(err => {
      res.send('Signout Success!');
    });
  });
};

// @desc    Initiate Google OAuth2 login
// @route   GET /auth/google
export const googleAuth = passport.authenticate('google', {
  scope: ['email', 'profile'],
});

// @desc    Handle Google OAuth2 callback
// @route   GET /auth/google/callback
export const googleAuthCallback = [
  passport.authenticate('google', {
    session: false, // important if you're using JWT instead of sessions
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/failure`,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as ReturnUserDto; // Type assertion for user object returned by passport

      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      const { accessToken, refreshToken } = await generateTokens(user.id);

      const hashedRefreshToken = hashTokenCrypto(refreshToken);
      await saveRefreshToken(user.id, hashedRefreshToken);

      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

      return res.redirect(
        `${frontend}/api/auth/google/callback?id=${user.id}&email=${user.email}&name=${user.name}&avatar=${user.avatar || ''}&emailVerified=${user.emailVerified}&isActive=${user.isActive}&accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error('Error in Google auth callback:', error);
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontend}/auth/failure`);
    }
  },
];

// @desc    Google OAuth2 failure route
// @route   GET /auth/google/failure
// todo: keep one failior route
export const googleAuthFailure = async (req: Request, res: Response) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontend}/auth/failure`);
};
