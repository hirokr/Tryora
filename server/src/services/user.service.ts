import prisma from '#src/config/database.ts';
import { CreateUserDto } from './dto/createUser.dto.ts';

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

export async function createUser(data: CreateUserDto) {
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

export async function verifyUserEmail(userId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, isActive: true },
    });
    return user;
  } catch (err) {
    console.error('Error in verifying email:', err);
    throw err;
  }
}


