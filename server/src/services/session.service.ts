import prisma from '#config/database.ts';
import { Store } from 'express-session';

export class PrismaSessionStore extends Store {
  async get(sid: string, callback: (err: any, session?: any) => void) {
    try {
      const dbSession = await prisma.userSession.findUnique({
        where: { sessionId: sid },
      });

      if (!dbSession) {
        // No session found - let Express-session create a new one
        return callback(null);
      }

      if (new Date() > dbSession.expiresAt) {
        // Session expired - delete it and create a new one
        await prisma.userSession.deleteMany({ where: { sessionId: sid } });
        return callback(null);
      }

      // Parse stored session data
      if (!dbSession.data) {
        return callback(null);
      }

      try {
        const sessionData = JSON.parse(dbSession.data);
        // Ensure the session has required properties
        if (sessionData && sessionData.cookie) {
          callback(null, sessionData);
        } else {
          callback(null);
        }
      } catch (e) {
        // If parsing fails, delete corrupted session and create a new one
        await prisma.userSession.deleteMany({ where: { sessionId: sid } });
        callback(null);
      }
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const expiresAt = new Date(
        session.cookie?.expires || Date.now() + 15 * 24 * 60 * 60 * 1000
      );

      // userId is optional - only set for authenticated sessions
      const userId = session.userId || null;

      await prisma.userSession.upsert({
        where: { sessionId: sid },
        update: {
          data: JSON.stringify(session),
          lastActiveAt: new Date(),
          expiresAt,
        },
        create: {
          sessionId: sid,
          userId,
          userAgent: session.userAgent || null,
          ipAddress: session.ipAddress || null,
          data: JSON.stringify(session),
          expiresAt,
        },
      });

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      // Use deleteMany to avoid errors if session doesn't exist
      await prisma.userSession.deleteMany({
        where: { sessionId: sid },
      });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async clear(callback?: (err?: any) => void) {
    try {
      await prisma.userSession.deleteMany({});
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const expiresAt = new Date(
        session.cookie?.expires || Date.now() + 15 * 24 * 60 * 60 * 1000
      );

      await prisma.userSession.updateMany({
        where: { sessionId: sid },
        data: {
          lastActiveAt: new Date(),
          expiresAt,
        },
      });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
}

export async function saveUserSession(
  userId: string,
  sessionId: string,
  userAgent?: string,
  ipAddress?: string
) {
  try {
    return await prisma.userSession.upsert({
      where: { sessionId },
      update: {
        userId,
        userAgent,
        ipAddress,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        sessionId,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.error('Error saving user session:', err);
    throw err;
  }
}
