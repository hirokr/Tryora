import prisma from '#src/config/database.ts';

export async function CreateGoogleUser(profile: any) {

  try {
    const user = await prisma.user.create({
      data: {
        email: profile.emails[0].value,
        fullName: profile.displayName,
        avatarUrl: profile.photos[0].value,
        // TODO: handle password for google users
        passwordHash: ' ', 
        isActive: true,
        emailVerified: true,
      },
    });

    return user;
  } catch (err) {
    console.error('Error in creating user:', err);
    throw err;
  }
}
