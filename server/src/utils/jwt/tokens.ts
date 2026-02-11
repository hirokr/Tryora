import { SignJWT, jwtVerify } from 'jose';

// Separate secrets for each token type
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_JWT_SECRET);

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables');
}

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
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
      payload: { userId: string };
    };
    return payload.userId;
  } catch (error) {
    return null;
  }
};
