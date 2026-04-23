"use client";

import { BACKEND_URL } from "@/constants/constants";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

type TryonSocketData = {
	id: string | null;
	userId: string;
	jobId: string;
	resultUrl: string | null;
	productIds: string[];
	tryonType: string;
	provider: string | null;
	createdAt: string;
	isPersisted: boolean;
};

type TryonJobStatusPayload = {
	jobId: string;
	status: string;
	jobType: string;
	outputresultUrl: string | null;
	tryonData: TryonSocketData | null;
};

const TRYON_SOCKET_EVENT = {
	SUBSCRIBE: "tryon:job:subscribe",
	UNSUBSCRIBE: "tryon:job:unsubscribe",
	STATUS: "tryon:job:status",
	DONE: "tryon:job:done",
	ERROR: "tryon:job:error",
} as const;

const MODEL_JOB_TYPES = new Set(["MODEL", "TRYON_MODEL"]);

type SessionPayload = {
	isAuthenticated: boolean;
	accessToken?: string;
};

type TryonSocketContextValue = {
	connectIfNeeded: () => Promise<void>;
	subscribeToJob: (jobId: string) => Promise<void>;
	unsubscribeFromJob: (jobId: string) => void;
	trackedJobs: TrackedTryonJob[];
	clearCompletedJobs: () => void;
};

export type TrackedTryonJob = {
	jobId: string;
	status: string;
	jobType: string;
	tryonId: string | null;
	errorMessage: string | null;
	updatedAt: number;
};

const TryonSocketContext = createContext<TryonSocketContextValue | null>(null);

const readAccessToken = async (refresh = false) => {
	const endpoint = refresh
		? "/api/auth/session?refresh=true"
		: "/api/auth/session";

	const response = await fetch(endpoint, {
		method: "GET",
		credentials: "include",
		cache: "no-store",
	});

	if (!response.ok) {
		return null;
	}

	const payload = (await response
		.json()
		.catch(() => null)) as SessionPayload | null;

	if (!payload?.isAuthenticated || !payload.accessToken) {
		return null;
	}

	return payload.accessToken;
};

export const TryonSocketProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const router = useRouter();
	const socketRef = useRef<Socket | null>(null);
	const connectingRef = useRef(false);
	const activeJobIdsRef = useRef(new Set<string>());
	const completedJobIdsRef = useRef(new Set<string>());
	const [trackedJobs, setTrackedJobs] = useState<TrackedTryonJob[]>([]);

	const upsertTrackedJob = useCallback(
		(job: Partial<TrackedTryonJob> & { jobId: string }) => {
			setTrackedJobs((previousJobs) => {
				const existingJob = previousJobs.find(
					(existing) => existing.jobId === job.jobId,
				);

				const nextJob: TrackedTryonJob = {
					jobId: job.jobId,
					status: job.status || existingJob?.status || "QUEUED",
					jobType: job.jobType || existingJob?.jobType || "UNKNOWN",
					tryonId:
						job.tryonId === undefined
							? existingJob?.tryonId || null
							: job.tryonId,
					errorMessage:
						job.errorMessage === undefined
							? existingJob?.errorMessage || null
							: job.errorMessage,
					updatedAt: Date.now(),
				};

				const remainingJobs = previousJobs.filter(
					(existing) => existing.jobId !== job.jobId,
				);

				return [nextJob, ...remainingJobs].slice(0, 12);
			});
		},
		[],
	);

	const handleJobStatus = useCallback(
		(payload: TryonJobStatusPayload) => {
			upsertTrackedJob({
				jobId: payload.jobId,
				status: payload.status,
				jobType: payload.jobType,
				tryonId: payload.tryonData?.id || null,
				errorMessage: null,
			});
		},
		[upsertTrackedJob],
	);

	const handleJobDone = useCallback(
		(payload: TryonJobStatusPayload) => {
			if (!payload.jobId || completedJobIdsRef.current.has(payload.jobId)) {
				return;
			}

			handleJobStatus(payload);

			completedJobIdsRef.current.add(payload.jobId);
			activeJobIdsRef.current.delete(payload.jobId);
			socketRef.current?.emit(TRYON_SOCKET_EVENT.UNSUBSCRIBE, {
				jobId: payload.jobId,
			});

			if (MODEL_JOB_TYPES.has(payload.jobType.toUpperCase())) {
				toast.success("3D model is ready", {
					description: "Opening Avatar Studio.",
					id: `tryon-job-done-${payload.jobId}`,
				});
				router.push(
					`/tryon/model/avatar-studio/${encodeURIComponent(payload.jobId)}`,
				);
				return;
			}

			const tryonId = payload.tryonData?.id;
			if (tryonId) {
				toast.success("Try-on completed", {
					description: (
						<a className='underline' href={`/tryon/${tryonId}`}>
							Open generated try-on result
						</a>
					),
					id: `tryon-job-done-${payload.jobId}`,
				});
				return;
			}

			toast.success("Try-on completed", {
				description: "Result is ready, but no try-on id was returned.",
				id: `tryon-job-done-${payload.jobId}`,
			});
		},
		[handleJobStatus, router],
	);

	const connectIfNeeded = useCallback(async () => {
		if (socketRef.current?.connected || connectingRef.current) {
			return;
		}

		connectingRef.current = true;
		try {
			const accessToken =
				(await readAccessToken()) || (await readAccessToken(true));
			if (!accessToken) {
				return;
			}

			const socket = io(`${BACKEND_URL}/tryon`, {
				transports: ["websocket", "polling"],
				withCredentials: true,
				auth: {
					token: `Bearer ${accessToken}`,
				},
			});

			socket.on("connect", () => {
				for (const jobId of activeJobIdsRef.current) {
					socket.emit(TRYON_SOCKET_EVENT.SUBSCRIBE, { jobId });
				}
			});

			socket.on(TRYON_SOCKET_EVENT.STATUS, (payload: TryonJobStatusPayload) => {
				handleJobStatus(payload);
				if (payload.status === "COMPLETED") {
					handleJobDone(payload);
				}
			});

			socket.on(TRYON_SOCKET_EVENT.DONE, (payload: TryonJobStatusPayload) => {
				handleJobDone(payload);
			});

			socket.on(
				TRYON_SOCKET_EVENT.ERROR,
				(payload: { message?: string; jobId?: string }) => {
					if (payload?.jobId) {
						upsertTrackedJob({
							jobId: payload.jobId,
							status: "FAILED",
							errorMessage: payload.message || "Socket error",
						});
					}

					const jobIdPrefix = payload?.jobId ? `[${payload.jobId}] ` : "";
					toast.error(`${jobIdPrefix}${payload?.message || "Socket error"}`, {
						id: payload?.jobId
							? `tryon-job-error-${payload.jobId}`
							: "tryon-socket-error",
					});
				},
			);

			socketRef.current = socket;
		} finally {
			connectingRef.current = false;
		}
	}, [handleJobDone, handleJobStatus, upsertTrackedJob]);

	const subscribeToJob = useCallback(
		async (jobId: string) => {
			if (!jobId) {
				return;
			}

			activeJobIdsRef.current.add(jobId);
			upsertTrackedJob({
				jobId,
				status: "QUEUED",
				errorMessage: null,
			});
			await connectIfNeeded();

			if (socketRef.current?.connected) {
				socketRef.current.emit(TRYON_SOCKET_EVENT.SUBSCRIBE, { jobId });
			}
		},
		[connectIfNeeded, upsertTrackedJob],
	);

	const unsubscribeFromJob = useCallback((jobId: string) => {
		if (!jobId) {
			return;
		}

		activeJobIdsRef.current.delete(jobId);
		socketRef.current?.emit(TRYON_SOCKET_EVENT.UNSUBSCRIBE, { jobId });
	}, []);

	const clearCompletedJobs = useCallback(() => {
		setTrackedJobs((previousJobs) =>
			previousJobs.filter((job) => job.status !== "COMPLETED"),
		);
	}, []);

	useEffect(() => {
		return () => {
			socketRef.current?.disconnect();
			socketRef.current = null;
		};
	}, []);

	return (
		<TryonSocketContext.Provider
			value={{
				connectIfNeeded,
				subscribeToJob,
				unsubscribeFromJob,
				trackedJobs,
				clearCompletedJobs,
			}}
		>
			{children}
		</TryonSocketContext.Provider>
	);
};

export const useTryonSocket = () => {
	const context = useContext(TryonSocketContext);
	if (!context) {
		throw new Error("useTryonSocket must be used inside TryonSocketProvider");
	}
	return context;
};
