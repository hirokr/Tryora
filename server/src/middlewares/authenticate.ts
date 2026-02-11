// middleware/auth.middleware.ts
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '#src/types/authRequest.type.ts';
// import { findUserById } from '#src/services/user.service.ts';

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

    const userid = await verifyAccessToken(token);
    
    if (!userid || typeof userid !== 'string') {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // const user = await findUserById(userid);
    // if (!user) {
    //   return res.status(401).json({ message: 'User not found' });
    // }
    
    req.userId = userid;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
