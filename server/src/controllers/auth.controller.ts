import { Request, Response } from 'express';

export const refresh = async (req: Request, res: Response) => {
  return 'refresh token';

  res.status(200).json({ message: 'Token refreshed' });
};

export const signup = async (req: Request, res: Response) => {
  return 'signup';

  res.status(201).json({ message: 'User registered successfully' });
};

export const signin = async (req: Request, res: Response) => {
  return 'refresh token';

  res.status(200).json({ message: 'Token refreshed' });
};

export const signout = async (req: Request, res: Response) => {
  return 'refresh token';

  res.status(200).json({ message: 'Token refreshed' });
};

export const logout = async (req: Request, res: Response) => {
  return 'logout';
  res.status(200).json({ message: 'Logged out successfully' });
};
