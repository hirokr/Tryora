import prisma from '#src/config/database.ts';

export async function saveRefreshToken(userId: string, refreshToken: string) {
  try {
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      },
    });
  } catch (err) {
    console.error('Error in saving refresh token:', err);
    throw err;
  }
}

export async function findRefreshToken(token: string) {
  try {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });
    return refreshToken;
  } catch (err) {
    console.error('Refresh Token Not Found:', err);
    throw err;
  }
}


export async function deleteRefreshToken(token: string) {
  try {
    await prisma.refreshToken.deleteMany({ where: { token } });
  } catch (err) {
    console.error('Error in deleting refresh token:', err);
    throw err;
  }
}

export async function deleteUserRefreshTokens(userId: string) {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  } catch (err) {
    console.error('Error in deleting user refresh tokens:', err);
    throw err;
  }
}

