"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import Loader from "@/components/ui/Loader";
import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/clientAuthFetch";

type TryonItem = {
	id: string;
	resultUrl: string;
	tryonType: string;
	provider: string;
	createdAt: string;
};

export default function StyleDiscoveryPage() {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const [tryons, setTryons] = useState<TryonItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const formatDate = useCallback((value: string) => {
		if (!value) {
			return "Unknown";
		}

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return "Unknown";
		}

		return date.toLocaleString();
	}, []);

	const readTryons = useCallback((payload: unknown): TryonItem[] => {
		const data = payload as
			| {
					data?: Array<Record<string, unknown>>;
			  }
			| Record<string, unknown>[]
			| null;

		const source = Array.isArray(data)
			? data
			: Array.isArray(data?.data)
				? data.data
				: [];

		return source
			.map((item) => {
				const resultUrl =
					typeof item.resultUrl === "string"
						? item.resultUrl
						: typeof item.outputresultUrl === "string"
							? item.outputresultUrl
							: "";

				if (!resultUrl) {
					return null;
				}

				return {
					id: typeof item.id === "string" ? item.id : "unknown",
					resultUrl,
					tryonType:
						typeof item.tryonType === "string"
							? item.tryonType
							: typeof item.jobType === "string"
								? item.jobType
								: "UNKNOWN",
					provider:
						typeof item.provider === "string" ? item.provider : "UNKNOWN",
					createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
				};
			})
			.filter((item): item is TryonItem => item !== null);
	}, []);

	const fetchTryons = useCallback(async () => {
		if (!isAuthenticated) {
			setTryons([]);
			setError("Sign in to see trending try-ons.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const response = await authFetch("/api/tryon/trending", {
				method: "GET",
			});

			const payload = await response.json().catch(() => null);

			if (response.status === 401) {
				throw new Error("Sign in to see trending try-ons.");
			}

			if (!response.ok) {
				const message =
					typeof (payload as { message?: unknown })?.message === "string"
						? (payload as { message: string }).message
						: "Failed to fetch try-ons";
				throw new Error(message);
			}

			setTryons(readTryons(payload));
			setError("");
		} catch (fetchError) {
			const message =
				fetchError instanceof Error
					? fetchError.message
					: "An error occurred while fetching try-ons";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, readTryons]);

	useEffect(() => {
		void fetchTryons();
	}, [fetchTryons]);

	const refreshProducts = () => {
		void fetchTryons();
	};

	const emptyMessage = useMemo(() => {
		if (!isAuthenticated) {
			return "Sign in to view trending try-ons.";
		}

		if (isLoading) {
			return "Loading trending try-ons...";
		}

		return "No try-ons found yet.";
	}, [isAuthenticated, isLoading]);

	if (isLoading && tryons.length === 0) {
		return <Loader />;
	}

	if (isAuthLoading) {
		return <Loader />;
	}

	return (
		<section className='relative mx-auto w-full max-w-5xl px-4 pb-14 pt-28 sm:px-6 lg:px-8'>
			<div className='rounded-2xl border border-white/10 bg-[#14131a] p-6 text-white'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Discover
				</p>
				<h1 className='mt-2 text-2xl font-bold'>Trending try-ons</h1>
				<p className='mt-2 text-sm text-slate-300'>
					See recent try-on results and images from the feed.
				</p>

				{error ? <p className='mt-3 text-sm text-red-300'>{error}</p> : null}

				<button
					type='button'
					onClick={refreshProducts}
					disabled={isLoading || !isAuthenticated}
					className='mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-white hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50'
				>
					Refresh try-ons
				</button>

				{tryons.length > 0 ? (
					<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{tryons.map((tryon) => (
							<article
								key={tryon.id}
								className='overflow-hidden rounded-xl border border-white/10 bg-white/5'
							>
								<div className='relative aspect-square w-full bg-black/30'>
									<Image
										src={tryon.resultUrl}
										alt={`Try-on ${tryon.id}`}
										fill
										sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
										className='object-cover'
										unoptimized
									/>
								</div>
								<div className='flex flex-col gap-1 p-3 text-sm text-slate-200'>
									<p>Type: {tryon.tryonType}</p>
									<p>Created: {formatDate(tryon.createdAt)}</p>
								</div>
							</article>
						))}
					</div>
				) : (
					<p className='mt-6 text-sm text-slate-300'>{emptyMessage}</p>
				)}
			</div>
		</section>
	);
}
