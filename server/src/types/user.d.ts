export type CreateUserDto = {
  email: string;
  name: string;
  avatarUrl?: string;
  verificationToken: string;
  passwordHash: string;
};

export type ReturnUserDto = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
};

export type UpdateUserProfileDto = {
  userId: string;
  name?: string;
  avatarUrl?: string;
  verificationToken?: string;
  isActive?: boolean;
  deletedAt?: Date | null;
};
