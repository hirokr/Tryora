import logger from '#src/config/logger.ts';
import { JobStatus } from '#src/generated/enums.ts';
import {
  getTryonJobStatusState,
  isTerminalJobStatus,
} from '#src/services/tryonJobStatus.service.ts';
import { Namespace, Socket } from 'socket.io';
import { socketAuthMiddleware } from './socketAuth.ts';
import { TryonJobStatusPayload } from '#src/types/jobs.js';

const TRYON_JOB_POLL_INTERVAL_MS =
  Number(process.env.TRYON_JOB_POLL_INTERVAL_MS) || 3000;

const TRYON_SOCKET_EVENT = {
  SUBSCRIBE: 'tryon:job:subscribe',
  SUBSCRIBED: 'tryon:job:subscribed',
  UNSUBSCRIBE: 'tryon:job:unsubscribe',
  STATUS: 'tryon:job:status',
  DONE: 'tryon:job:done',
  ERROR: 'tryon:job:error',
} as const;

interface SubscribePayload {
  jobId: string;
}

const isSubscribePayload = (value: unknown): value is SubscribePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybePayload = value as Partial<SubscribePayload>;
  return (
    typeof maybePayload.jobId === 'string' && maybePayload.jobId.length > 0
  );
};

const clearSubscription = (
  subscriptions: Map<string, NodeJS.Timeout>,
  jobId: string
) => {
  const existingInterval = subscriptions.get(jobId);
  if (existingInterval) {
    clearInterval(existingInterval);
    subscriptions.delete(jobId);
  }
};

const clearAllSubscriptions = (subscriptions: Map<string, NodeJS.Timeout>) => {
  for (const [jobId, intervalId] of subscriptions.entries()) {
    clearInterval(intervalId);
    subscriptions.delete(jobId);
  }
};

const emitJobStatus = async (
  socket: Socket,
  jobId: string
): Promise<TryonJobStatusPayload> => {
  const jobState = await getTryonJobStatusState(jobId);
  const currentUserId = socket.data.userId as string | undefined;

  if (!currentUserId || jobState.ownerUserId !== currentUserId) {
    throw new Error('Forbidden: job does not belong to this user');
  }

  socket.emit(TRYON_SOCKET_EVENT.STATUS, jobState.payload);
  if (jobState.payload.status === JobStatus.COMPLETED) {
    socket.emit(TRYON_SOCKET_EVENT.DONE, jobState.payload);
  }

  return jobState.payload;
};

export const registerTryonSocketNamespace = (namespace: Namespace) => {
  namespace.use(socketAuthMiddleware);

  namespace.on('connection', socket => {
    const subscriptions = new Map<string, NodeJS.Timeout>();
    const connectedUserId = socket.data.userId as string | undefined;

    logger.info('[TryonSocket] Client connected', {
      socketId: socket.id,
      userId: connectedUserId,
    });

    socket.on(TRYON_SOCKET_EVENT.SUBSCRIBE, async payload => {
      if (!isSubscribePayload(payload)) {
        socket.emit(TRYON_SOCKET_EVENT.ERROR, {
          message: 'Invalid subscribe payload. Expected { jobId: string }',
        });
        return;
      }

      const { jobId } = payload;

      clearSubscription(subscriptions, jobId);

      try {
        const firstStatus = await emitJobStatus(socket, jobId);

        socket.emit(TRYON_SOCKET_EVENT.SUBSCRIBED, {
          jobId,
          pollIntervalMs: TRYON_JOB_POLL_INTERVAL_MS,
        });

        if (isTerminalJobStatus(firstStatus.status)) {
          return;
        }

        const intervalId = setInterval(() => {
          void (async () => {
            try {
              const nextStatus = await emitJobStatus(socket, jobId);
              if (isTerminalJobStatus(nextStatus.status)) {
                clearSubscription(subscriptions, jobId);
              }
            } catch (error) {
              clearSubscription(subscriptions, jobId);

              socket.emit(TRYON_SOCKET_EVENT.ERROR, {
                jobId,
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to read latest job status',
              });
            }
          })();
        }, TRYON_JOB_POLL_INTERVAL_MS);

        subscriptions.set(jobId, intervalId);
      } catch (error) {
        socket.emit(TRYON_SOCKET_EVENT.ERROR, {
          jobId,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to subscribe to job updates',
        });
      }
    });

    socket.on(TRYON_SOCKET_EVENT.UNSUBSCRIBE, payload => {
      if (!isSubscribePayload(payload)) {
        return;
      }

      clearSubscription(subscriptions, payload.jobId);
    });

    socket.on('disconnect', reason => {
      clearAllSubscriptions(subscriptions);

      logger.info('[TryonSocket] Client disconnected', {
        socketId: socket.id,
        userId: connectedUserId,
        reason,
      });
    });
  });
};

export { TRYON_SOCKET_EVENT };
