import prisma from '#src/config/database.ts';

export async function CreateGoogleUser(profile: any) {
  try {
    const user = await prisma.user.create({
      data: {
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0].value,
        password: ' ', // You might want to handle this differently
      },
    });

    return user;
  } catch (err) {
    console.error('Error in creating user:', err);
    throw err;
  }
}
