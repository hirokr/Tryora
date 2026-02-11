import prisma from '#src/config/database.ts';

export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (err) {
    console.error('Error in finding user:', err);
    throw err;
  }
}

export async function findUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (err) {
    console.error('Error in finding user:', err);
    throw err;
  }
}

export async function createUser(data: {
  email: string;
  name: string;
  avatar: string | undefined;
  password: string;
}) {
  try {
    const user = await prisma.user.create({
      data,
    });
    return user;
  } catch (err) {
    console.error('Error in creating user:', err);
    throw err;
  }
}
