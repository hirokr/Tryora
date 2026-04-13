// middleware/auth.middleware.ts
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import { Response, NextFunction, Request, RequestHandler } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { getSetCache, makeUserSessionCacheKey } from '#src/utils/redis.ts';
import { isValidSession } from '#src/services/token.service.ts';
import { z, ZodError } from 'zod/v3';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const getData = await verifyAccessToken(token);
    const { userId, sessionId } = getData || {};

    if (!userId || !sessionId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const cacheKey = makeUserSessionCacheKey(userId, sessionId);
    const isActiveSession = await getSetCache(cacheKey, () =>
      isValidSession(userId, sessionId)
    );

    if (!isActiveSession) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    (req as AuthRequest).userId = userId;
    (req as AuthRequest).sessionId = sessionId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const validateRequest =
  <T extends z.ZodTypeAny>(schema: T) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.body);

      // Important: overwrite body with validated + transformed data
      req.body = parsed;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: error.errors[0]?.message || 'Validation error',
          errors: error.flatten().fieldErrors,
        });
        return;
      }

      next(error);
    }
  };
