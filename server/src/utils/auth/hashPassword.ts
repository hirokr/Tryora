import { hash } from 'argon2';

export const hashPassword = async (password: string) => {
  const hashedPass = await hash(password);
  return hashedPass;
};
