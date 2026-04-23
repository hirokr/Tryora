"use client";

import Link from "next/link";

import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/authFetch";
import { useEffect, useState } from "react";
import { useTryonSocket } from "@/context/tryonSocket.context";
import { TryonPreviewCard } from "./_components/tryon-preview";

type TryonRecord = {
	id: string;
	resultUrl?: string | null;
	tryonType?: string;
	createdAt?: string;
};

type TryonListResponse = {
	data?: TryonRecord[];
	results?: TryonRecord[];
	message?: string;
};

type QueueJobResponse = {
	jobId?: string;
	message?: string;
};

export default function TryOnModelPage() {
	const { user, isLoading: isAuthLoading } = useAuth();
	const userId = user?.id || "";
	const [tryons, setTryons] = useState<TryonRecord[]>([]);
	const [selectedTryonId, setSelectedTryonId] = useState("");
	const [isTryonsLoading, setIsTryonsLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const { connectIfNeeded, subscribeToJob } = useTryonSocket();

	useEffect(() => {
		void connectIfNeeded();
	}, [connectIfNeeded]);

	useEffect(() => {
		const loadTryons = async () => {
			if (isAuthLoading) {
				return;
			}

			if (!userId) {
				setTryons([]);
				setSelectedTryonId("");
				setIsTryonsLoading(false);
				return;
			}

			setIsTryonsLoading(true);
			setLoadError(null);

			try {
				const response = await authFetch(`/api/tryon/user/${userId}`, {
					method: "GET",
					cache: "no-store",
				});

				const payload = (await response
					.json()
					.catch(() => ({}))) as TryonListResponse;
				const tryonCollection = Array.isArray(payload.data)
					? payload.data
					: Array.isArray(payload.results)
						? payload.results
						: [];

				if (!response.ok) {
					throw new Error(payload.message || "Failed to load your try-ons.");
				}

				const withResults = tryonCollection.filter(
					(item): item is TryonRecord =>
						typeof item.id === "string" &&
						item.id.length > 0 &&
						Boolean(item.resultUrl),
				);

				setTryons(withResults);
				setSelectedTryonId((currentId) =>
					withResults.some((item) => item.id === currentId) ? currentId : "",
				);
			} catch (loadItemsError) {
				setLoadError(
					loadItemsError instanceof Error
						? loadItemsError.message
						: "Failed to load your try-ons.",
				);
				setTryons([]);
				setSelectedTryonId("");
			} finally {
				setIsTryonsLoading(false);
			}
		};

		void loadTryons();
	}, [isAuthLoading, userId]);

	const handleGenerateTryOn = async (tryonId: string) => {
		setIsLoading(true);
		setError(null);
		setSelectedTryonId(tryonId);

		const jobPayload = await authFetch("/api/tryon/model/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				tryonId,
			}),
		});

		if (!jobPayload.ok) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		const payload = (await jobPayload
			.json()
			.catch(() => ({}))) as QueueJobResponse;
		const jobId = typeof payload.jobId === "string" ? payload.jobId : "";

		if (!jobId) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		await subscribeToJob(jobId);
		setSelectedTryonId("");
		setIsLoading(false);
	};

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			{error ? (
				<div className='mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200'>
					{error}
				</div>
			) : null}
			{loadError ? (
				<div className='mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200'>
					{loadError}
				</div>
			) : null}

			<section>
				{isTryonsLoading || isAuthLoading ? (
					<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{Array.from({ length: 6 }).map((_, index) => (
							<div
								key={index}
								className='h-80 animate-pulse rounded-xl border border-white/10 bg-black/20'
							/>
						))}
					</div>
				) : tryons.length > 0 ? (
					<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{tryons.map((tryon) => (
							<TryonPreviewCard
								key={tryon.id}
								tryon={tryon}
								isSelected={selectedTryonId === tryon.id}
								onSelect={(tryonId) => setSelectedTryonId(tryonId)}
								onGenerate={(tryonId) => {
									void handleGenerateTryOn(tryonId);
								}}
								isGenerating={isLoading}
							/>
						))}
					</div>
				) : (
					<div className='rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-400'>
						<p>
							You do not have any try-ons ready for 3D model generation yet.
						</p>
						<Link
							href='/tryon/image'
							className='mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-white transition hover:bg-white/10'
						>
							Start an image try-on
						</Link>
					</div>
				)}
			</section>
		</main>
	);
}
