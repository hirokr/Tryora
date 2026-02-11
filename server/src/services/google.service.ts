import prisma from '#src/config/database.ts';

export async function CreateGoogleUser(profile: any) {
  try {
    const user = await prisma.user.create({
      data: {
        email: profile.emails[0].value,
        name: profile.displayName,
        avatarUrl: profile.photos[0].value,
        // TODO: handle password for google users
        passwordHash: ' ',
        isActive: true,
        emailVerified: true,
        oauthProvider: 'google',
        oauthId: profile.id,
      },
    });

    return user;
  } catch (err) {
    console.error('Error in creating user:', err);
    throw err;
  }
}
