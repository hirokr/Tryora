import prisma from '#src/config/database.ts';
import {
  CreateUserDto,
  ReturnUserDto,
  UpdateUserProfileDto,
} from '#src/types/user.type.ts';

export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user;
  } catch (err) {
    console.error('User Not Found:', err);
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
    console.error('User Not Found:', err);
    throw err;
  }
}

export async function createUser(data: CreateUserDto): Promise<ReturnUserDto> {
  try {
    const { email, name, passwordHash, avatarUrl } = data;
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        avatarUrl,
      },
    });

    const newUser: ReturnUserDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl || undefined,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };

    return newUser;
  } catch (err) {
    console.error('Error in creating user:', err);
    throw err;
  }
}

export async function updateUserProfile(
  data: UpdateUserProfileDto
): Promise<ReturnUserDto> {
  try {
    const { userId, ...updateData } = data;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl || undefined,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };
  } catch (err) {
    console.error('Error in updating user profile:', err);
    throw err;
  }
}

export async function updateUserPassword(
  userId: string,
  newPasswordHash: string
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  } catch (err) {
    console.error('Error in updating user password:', err);
    throw err;
  }
}

export async function verifyUserEmail(userId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, isActive: true },
    });
    return user as ReturnUserDto;
  } catch (err) {
    console.error('Error in verifying email:', err);
    throw err;
  }
}
