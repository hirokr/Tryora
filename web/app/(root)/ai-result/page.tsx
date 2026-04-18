"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ResultActions } from "@/components/utility/ai/ResultActions";
import { ResultAvatarPanel } from "@/components/utility/ai/ResultAvatarPanel";

import { ResultMetricsCard } from "@/components/utility/ai/ResultMetricsCard";

import { AiResultBackground } from "./_components/AiResultBackground";
import { AiResultHeading } from "./_components/AiResultHeading";

type ModelStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

type StoredModel3DState = {
  tryonResultId: string;
  jobId?: string;
  status: ModelStatus;
  progress?: number;
  currentStage?: string;
  glbUrl?: string;
  errorMessage?: string;
  updatedAt: string;
};

type JobStatusPayload = {
  status: ModelStatus | "CANCELLED";
  progress?: number;
  currentStage?: string;
  outputGlbUrl?: string | null;
  errorMessage?: string | null;
};

const MODEL_3D_STATE_STORAGE_KEY = "tryora.avatar.model3d.state";
const AVATAR_UPLOADS_STORAGE_KEY = "tryora.avatar.uploadedPhotos";

function loadStoredState() {
  const rawValue = localStorage.getItem(MODEL_3D_STATE_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as StoredModel3DState;
  } catch {
    return null;
  }
}

function persistState(state: StoredModel3DState) {
  localStorage.setItem(MODEL_3D_STATE_STORAGE_KEY, JSON.stringify(state));
}

export default function AiSyncResultPage() {
	const [previewSrc, setPreviewSrc] = useState<string>("/avatar/avatar_result1.png");
	const [modelState, setModelState] = useState<StoredModel3DState | null>(null);
	const [statusMessage, setStatusMessage] = useState<string>("Preparing your AI result...");
	const hasBootstrappedNoJobState = useRef(false);

	useEffect(() => {
		const rawValue = localStorage.getItem(AVATAR_UPLOADS_STORAGE_KEY);
		if (rawValue) {
			try {
				const parsed = JSON.parse(rawValue) as {
					front?: {
						url: string;
					};
				};
				if (parsed?.front?.url) {
					setPreviewSrc(parsed.front.url);
				}
			} catch {
				// Ignore malformed payload.
			}
		}

		const storedState = loadStoredState();
		if (!storedState) {
			setStatusMessage("No 3D generation job found. Start from Update Pics and press Sync.");
			return;
		}

		setModelState(storedState);
	}, []);

	const refreshModelStatus = async (nextState: StoredModel3DState) => {
		if (!nextState.tryonResultId) return nextState;

		const modelResponse = await fetch(`/api/3d/${nextState.tryonResultId}`, {
			method: "GET",
		});

		if (modelResponse.status === 200) {
			const modelPayload = (await modelResponse.json()) as {
				glbUrl?: string;
			};
			if (modelPayload.glbUrl) {
				const completedState: StoredModel3DState = {
					...nextState,
					status: "COMPLETED",
					glbUrl: modelPayload.glbUrl,
					progress: 100,
					currentStage: "done",
					updatedAt: new Date().toISOString(),
				};
				persistState(completedState);
				setModelState(completedState);
				setStatusMessage("3D model is ready.");
				return completedState;
			}
		}

		if (modelResponse.status === 202) {
			const pendingPayload = (await modelResponse.json().catch(() => ({}))) as {
				message?: string;
				job?: {
					status?: ModelStatus;
					progress?: number;
					currentStage?: string;
					errorMessage?: string | null;
				};
			};

			const pendingState: StoredModel3DState = {
				...nextState,
				status: pendingPayload.job?.status || nextState.status,
				progress: pendingPayload.job?.progress ?? nextState.progress,
				currentStage: pendingPayload.job?.currentStage || nextState.currentStage,
				errorMessage: pendingPayload.job?.errorMessage || nextState.errorMessage,
				updatedAt: new Date().toISOString(),
			};

			persistState(pendingState);
			setModelState(pendingState);
			setStatusMessage(pendingPayload.message || "3D model is being generated.");
			return pendingState;
		}

		if (modelResponse.status === 404) {
			const failedState: StoredModel3DState = {
				...nextState,
				status: "FAILED",
				errorMessage: "Try-on result not found for this account.",
				updatedAt: new Date().toISOString(),
			};
			persistState(failedState);
			setModelState(failedState);
			setStatusMessage(failedState?.errorMessage);
			return failedState;
		}

		return nextState;
	};

	useEffect(() => {
		if (!modelState) return;

		if (modelState.status === "COMPLETED" && modelState.glbUrl) {
			setStatusMessage("3D model is ready.");
			return;
		}

		if (modelState.status === "FAILED") {
			setStatusMessage(modelState.errorMessage || "3D generation failed.");
			return;
		}

		const bootstrap = async () => {
			if (!modelState.jobId && !hasBootstrappedNoJobState.current) {
				hasBootstrappedNoJobState.current = true;
				await refreshModelStatus(modelState);
			}
		};

		bootstrap();
	}, [modelState]);

	useEffect(() => {
		if (!modelState?.jobId) return;
		if (modelState.status === "COMPLETED" || modelState.status === "FAILED") return;

		const poll = async () => {
			const response = await fetch(`/api/jobs/${modelState.jobId}`, {
				method: "GET",
			});

			if (!response.ok) {
				if (response.status === 404) {
					const failedState: StoredModel3DState = {
						...modelState,
						status: "FAILED",
						errorMessage: "Generation job not found.",
						updatedAt: new Date().toISOString(),
					};
					persistState(failedState);
					setModelState(failedState);
					setStatusMessage(failedState?.errorMessage);
				}
				return;
			}

			const payload = (await response.json()) as JobStatusPayload;

			if (payload.status === "COMPLETED") {
				const completedCandidate: StoredModel3DState = {
					...modelState,
					status: "COMPLETED",
					progress: 100,
					currentStage: "done",
					glbUrl: payload.outputGlbUrl || modelState.glbUrl,
					updatedAt: new Date().toISOString(),
				};

				await refreshModelStatus(completedCandidate);
				return;
			}

			if (payload.status === "FAILED" || payload.status === "CANCELLED") {
				const failedState: StoredModel3DState = {
					...modelState,
					status: "FAILED",
					errorMessage: payload.errorMessage || "3D generation failed.",
					updatedAt: new Date().toISOString(),
				};

				persistState(failedState);
				setModelState(failedState);
				setStatusMessage(failedState.errorMessage || "3D generation failed.");
				return;
			}

			const inProgressState: StoredModel3DState = {
				...modelState,
				status: payload.status === "QUEUED" ? "QUEUED" : "PROCESSING",
				progress: payload.progress ?? modelState.progress,
				currentStage: payload.currentStage || modelState.currentStage,
				updatedAt: new Date().toISOString(),
			};

			persistState(inProgressState);
			setModelState(inProgressState);
			setStatusMessage(
				inProgressState.status === "QUEUED"
					? "3D generation job is queued."
					: `3D generation in progress${typeof inProgressState.progress === "number" ? ` (${inProgressState.progress}%)` : ""}.`,
			);
		};

		poll();
		const intervalId = window.setInterval(poll, 5000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [modelState]);

	const panelStatus = useMemo(() => {
		if (!modelState) {
			return {
				label: "Awaiting Job",
				tone: "processing" as const,
			};
		}

		if (modelState.status === "COMPLETED") {
			return {
				label: "3D Model Ready",
				tone: "success" as const,
			};
		}

		if (modelState.status === "FAILED") {
			return {
				label: "Generation Failed",
				tone: "error" as const,
			};
		}

		if (modelState.status === "QUEUED") {
			return {
				label: "Queued",
				tone: "processing" as const,
			};
		}

		return {
			label: typeof modelState.progress === "number" ? `Processing ${modelState.progress}%` : "Processing",
			tone: "processing" as const,
		};
	}, [modelState]);

	return (
		<div
			className="relative min-h-screen overflow-x-hidden font-display text-slate-100"
			style={{ backgroundColor: "#191022" }}
		>
			<AiResultBackground />

			<div className="relative flex min-h-screen w-full flex-col">
				{/* <ResultHeader /> */}

				<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12">
					<ResultAvatarPanel imageSrc={previewSrc} statusLabel={panelStatus.label} statusTone={panelStatus.tone} />
					<AiResultHeading />

					<div className="mb-6 w-full max-w-2xl rounded-xl border border-primary/20 bg-primary/10 px-5 py-4 text-center">
						<p className="text-sm text-slate-200">{statusMessage}</p>
						{modelState?.currentStage && modelState.status !== "COMPLETED" && (
							<p className="mt-1 text-xs uppercase tracking-wider text-primary/80">Stage: {modelState.currentStage}</p>
						)}
						{modelState?.glbUrl && (
							<a
								href={modelState.glbUrl}
								target="_blank"
								rel="noreferrer"
								className="mt-2 inline-block text-sm font-semibold text-primary underline"
							>
								Open Generated 3D Model
							</a>
						)}
					</div>

					<ResultMetricsCard />
					<ResultActions />
				</main>
			</div>
		</div>
	);
}
