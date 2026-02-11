// middleware/auth.middleware.ts
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import { Request, Response, NextFunction } from 'express';


export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const userid  = await verifyAccessToken(token);

    if (!userid || typeof userid !== 'string') {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.userId = userid;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
