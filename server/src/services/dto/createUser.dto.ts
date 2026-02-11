export type CreateUserDto = {
  email: string;
  name: string;
  avatar?: string;
  password: string;
};

export type ReturnUserDto = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
};
