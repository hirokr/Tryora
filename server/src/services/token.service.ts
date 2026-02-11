import prisma from "#src/config/database.ts";

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