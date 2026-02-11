import prisma from '#config/database.ts';
import { Store } from 'express-session';

export class PrismaSessionStore extends Store {
  async get(sid: string, callback: (err: any, session?: any) => void) {
    try {
      console.log(sid);
      const session = await prisma.userSession.findUnique({
        where: { sessionId: sid },
      });

      if (!session || new Date() > session.expiresAt) {
        if (session) {
          await prisma.userSession.delete({ where: { sessionId: sid } });
        }
        return callback(null);
      }

      callback(null, {
        userId: session.userId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      });
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      // Only persist sessions for authenticated users
      if (!session.userId) {
        callback?.();
        return;
      }

      const expiresAt = new Date(
        session.cookie.expires || Date.now() + 15 * 24 * 60 * 60 * 1000
      );

      await prisma.userSession.upsert({
        where: { sessionId: sid },
        update: {
          lastActiveAt: new Date(),
          expiresAt,
        },
        create: {
          sessionId: sid,
          userId: session.userId,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
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
      // Only update sessions for authenticated users
      if (!session.userId) {
        callback?.();
        return;
      }

      await prisma.userSession.update({
        where: { sessionId: sid },
        data: { lastActiveAt: new Date() },
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
    return await prisma.userSession.create({
      data: {
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
