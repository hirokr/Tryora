import { redisClient } from '#src/app.ts';

let DEFAULT_EXPIRATION =
  Number(process.env.REDIS_DEFAULT_EXPIRATION) || 15 * 60 * 60 * 24;

// ! Gpt experimental function, not used anywhere yet
export const getSetRedis = (key: string, cb: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      redisClient.on('error', err => console.log('Redis Client Error', err));
      await redisClient.connect();

      const data = await redisClient.get(key);
      if (data) {
        await redisClient.quit();
        return resolve(JSON.parse(data));
      }

      const freshData = await cb();
      await redisClient.set(key, JSON.stringify(freshData), {
        EX: 60 * 60 * 24,
      });
      await redisClient.quit();
      resolve(freshData);
    } catch (error) {
      reject(error);
    }
  });
};

type cacheEntry = {
  userId: string;
  sessionId: string;
};

// DONE: Create a utility function to get and set cache with expiration
export const getSetCache = async <Boolean>(
  key: string,
  cb: () => Promise<any>
): Promise<any> => {
  const data = await redisClient.get(key);

  if (data !== null) {
    return JSON.parse(data);
  }

  const freshData = await cb();
  if (freshData === null || freshData === undefined) {
    return null as any;
  }
  _addKeyAndIndex(key, freshData.userId, freshData.sessionId);

  return true;
};

// DONE: invalidate cache by key
export const invalidateCache = async (
  key: string,
  userId: string
): Promise<void> => {

  const indexKey = `user-session-index:${userId}`;
  await redisClient.sRem(indexKey, key);
  await redisClient.del(key);
};

// DONE: Create a utility function to get cache without setting it
export const getCache = async (key: string): Promise<any> => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

// DONE: Create a utility function to set cache with expiration
export const setCache = async (
  key: string,
  userId: string,
  value: any,
  expiration?: number
) => {
  _addKeyAndIndex(key, userId, value, expiration);
};

// DONE: Create a utility function to generate cache key for user sessions
export const makeUserSessionCacheKey = (userId: string, sessionId: string) =>
  `user-session:${userId}:${sessionId}`;

// DONE: create a utility function to delete all cache related to a user (e.g., on account deletion)
export const deleteUserCache = async (userId: string): Promise<void> => {
  const indexKey = `user-session-index:${userId}`;
  const sessionKeys = await redisClient.sMembers(indexKey);

  if (sessionKeys.length > 0) {
    await redisClient.del(sessionKeys);
  }
  await redisClient.del(indexKey);
};

// DONE: Create a helper function to add cache key to user's session index
const _addKeyAndIndex = async (
  key: string,
  userId: string,
  value: any,
  expiration?: number
) => {
  const exp = expiration || DEFAULT_EXPIRATION;
  await redisClient.set(key, JSON.stringify(value), {
    EX: exp,
  });
  await redisClient.sAdd(`user-session-index:${userId}`, key);
};
