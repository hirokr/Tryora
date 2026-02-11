export type CreateUserDto = {
  email: string;
  name: string;
  avatarUrl?: string;
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
