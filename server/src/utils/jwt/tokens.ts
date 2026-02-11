import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// Separate secrets for each token type
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_JWT_SECRET);

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables');
}

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '5m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN || '15d';

export const generateTokens = async (userId: string) => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId),
    generateRefreshToken(userId),
  ]);
  return { accessToken, refreshToken };
};

export const generateAccessToken = (userId: string) => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRES_IN)
    .sign(ACCESS_SECRET);
};

export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = (await jwtVerify(token, ACCESS_SECRET)) as {
      payload: { userId: string };
    };
    return payload.userId;
  } catch (error) {
    return null;
  }
};

export const generateRefreshToken = (userId: string) => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const { payload } = (await jwtVerify(token, REFRESH_SECRET)) as {
      payload: { userId: string } | undefined;
    };
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
};

export const clearTokens = (res: any) => {
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
};

export const hasExpired = (token: string, type: 'access' | 'refresh') => {
  const secret = type === 'access' ? ACCESS_SECRET : REFRESH_SECRET;
  try {
    jwtVerify(token, secret);
    return false; // Token is valid and not expired
  } catch (error) {
    return true; // Token is invalid or expired
  }
}


export const saveToCookie = async (
  res: any,
  refreshToken: string,
  accessToken: string
) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
  });
};

export function hashTokenCrypto(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
