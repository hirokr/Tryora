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

// DONE: Create a utility function to get and set cache with expiration
export const getSetCache = async <T>(
  key: string,
  cb: () => Promise<T>
): Promise<T> => {
  const data = await redisClient.get(key);

  if (data !== null) {
    return JSON.parse(data);
  }

  const freshData = await cb();
  if (freshData === null) {
    return null as any;
  }

  await redisClient.set(key, JSON.stringify(freshData), {
    EX: DEFAULT_EXPIRATION,
  });

  return freshData;
};

// DONE: invalidate cache by key
export const invalidateCache = async (key: string): Promise<void> => {
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
  value: any,
  expiration?: number
) => {
  const exp = expiration || DEFAULT_EXPIRATION;
  await redisClient.set(key, JSON.stringify(value), {
    EX: exp,
  });
};

// DONE: Create a utility function to generate cache key for user sessions
export const makeUserSessionCacheKey = (userId: string, sessionId: string) =>
  `user-session:${userId}:${sessionId}`;
