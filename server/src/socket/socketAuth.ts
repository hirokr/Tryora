import { isValidSession } from '#src/services/token.service.ts';
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import { Socket } from 'socket.io';

const getAccessToken = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
  }

  const authorization = socket.handshake.headers.authorization;
  if (
    typeof authorization === 'string' &&
    authorization.startsWith('Bearer ')
  ) {
    return authorization.slice(7);
  }

  const tokenQuery = socket.handshake.query.token;
  if (typeof tokenQuery === 'string' && tokenQuery.length > 0) {
    return tokenQuery;
  }

  return null;
};

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const accessToken = getAccessToken(socket);
    if (!accessToken) {
      return next(new Error('Unauthorized: missing access token'));
    }

    const tokenData = await verifyAccessToken(accessToken);
    if (!tokenData?.userId || !tokenData?.sessionId) {
      return next(new Error('Unauthorized: invalid access token'));
    }

    const isActiveSession = await isValidSession(
      tokenData.userId,
      tokenData.sessionId
    );
    if (!isActiveSession) {
      return next(new Error('Unauthorized: invalid session'));
    }

    socket.data.userId = tokenData.userId;
    socket.data.sessionId = tokenData.sessionId;

    return next();
  } catch (error) {
    return next(new Error('Unauthorized: unable to authenticate socket'));
  }
};
