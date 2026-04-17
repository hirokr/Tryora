import logger from '#src/config/logger.ts';
import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { registerTryonSocketNamespace } from './tryon.socket.ts';

let socketServer: SocketIOServer | null = null;

export const initializeSocketServer = (
  httpServer: HttpServer
): SocketIOServer => {
  if (socketServer) {
    return socketServer;
  }

  socketServer = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  registerTryonSocketNamespace(socketServer.of('/tryon'));

  logger.info('[Socket] Socket.IO initialized at namespace /tryon');

  return socketServer;
};

export const closeSocketServer = async (): Promise<void> => {
  if (!socketServer) {
    return;
  }

  await socketServer.close();
  socketServer = null;
};

export const getSocketServer = (): SocketIOServer | null => socketServer;
