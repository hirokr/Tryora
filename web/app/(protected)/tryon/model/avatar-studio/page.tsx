'use client'
import { AvatarStudioModelViewer } from "@/components/utility/avatar/studio/AvatarStudioModelViewer";
import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/authFetch";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UserModelRecord = {
	id: string;
	outputresultUrl?: string | null;
	outputResultUrl?: string | null;
	createdAt?: string | null;
};

type UserModelResponse = {
	success?: boolean;
	data?: UserModelRecord[];
	results?: UserModelRecord[];
	message?: string;
};

const EMPTY_MODELS: UserModelRecord[] = [];

function formatDate(value?: string | null) {
	if (!value) return "Unknown";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Unknown";

	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function resolveModelUrl(model: UserModelRecord) {
	return (
		(typeof model.outputResultUrl === "string" && model.outputResultUrl) ||
		(typeof model.outputresultUrl === "string" && model.outputresultUrl) ||
		null
	);
}

export default function AvatarStudioLandingPage() {
	const { isLoading: isAuthLoading } = useAuth();
	const [models, setModels] = useState<UserModelRecord[]>(EMPTY_MODELS);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		const loadModels = async () => {
			if (isAuthLoading) {
				return;
			}

			setIsLoading(true);
			setLoadError(null);

			try {
				const response = await authFetch("/api/tryon/models/user", {
					method: "GET",
					cache: "no-store",
				});

				const payload = (await response
					.json()
					.catch(() => ({}))) as UserModelResponse;
				const collection = Array.isArray(payload.data)
					? payload.data
					: Array.isArray(payload.results)
						? payload.results
						: [];

				if (!response.ok) {
					throw new Error(payload.message || "Failed to load your models.");
				}

				const withModels = collection.filter(
					(item): item is UserModelRecord =>
						typeof item.id === "string" &&
						item.id.length > 0 &&
						Boolean(resolveModelUrl(item)),
				);

				setModels(withModels);
			} catch (error) {
				setModels(EMPTY_MODELS);
				setLoadError(
					error instanceof Error
						? error.message
						: "Failed to load your models.",
				);
			} finally {
				setIsLoading(false);
			}
		};

		void loadModels();
	}, [isAuthLoading]);

	const resolvedModels = useMemo(
		() =>
			models
				.map((model) => ({
					...model,
					modelUrl: resolveModelUrl(model),
				}))
				.filter((model) => Boolean(model.modelUrl)),
		[models],
	);

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<section className='overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,18,38,0.96),rgba(13,10,25,0.96))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8'>
				<div className='max-w-3xl space-y-4'>
					<p className='text-xs uppercase tracking-[0.2em] text-cyan-100'>
						Avatar Studio
					</p>
					<h1 className='font-serif text-3xl sm:text-4xl'>
						Open a generated 3D model
					</h1>
					<p className='text-sm leading-6 text-slate-300 sm:text-base'>
						This route expects a try-on job id in the URL. When a model job
						finishes, the studio opens the matching dynamic page and renders the
						returned 3D model with React Three Fiber.
					</p>
				</div>

				<div className='mt-8 flex flex-wrap gap-3'>
					<Link
						href='/tryon/model'
						className='rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10'
					>
						Back to model jobs
					</Link>
					<Link
						href='/tryon'
						className='rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200'
					>
						Try-on history
					</Link>
				</div>
			</section>

			<section className='mt-10 space-y-6'>
				<div className='flex flex-wrap items-center justify-between gap-4'>
					<div>
						<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
							Your 3D models
						</p>
						<h2 className='mt-2 text-2xl font-semibold text-white'>
							Generated .glb previews
						</h2>
						<p className='mt-2 text-sm text-slate-300'>
							These models are loaded from the `api/tryon/models/user` endpoint.
						</p>
					</div>
					<Link
						href='/tryon/model'
						className='rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10'
					>
						Generate new model
					</Link>
				</div>

				{loadError ? (
					<div className='rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100'>
						{loadError}
					</div>
				) : null}

				{isLoading || isAuthLoading ? (
					<div className='grid gap-8 2xl:grid-cols-2'>
						{Array.from({ length: 2 }).map((_, index) => (
							<div
								key={index}
								className='h-96 animate-pulse rounded-4xl border border-white/10 bg-black/20'
							/>
						))}
					</div>
				) : resolvedModels.length > 0 ? (
					<div className='grid gap-8 2xl:grid-cols-2'>
						{resolvedModels.map((model) => (
							<article
								key={model.id}
								className='rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,10,20,0.96),rgba(6,6,12,0.96))] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.3)]'
							>
								{model.modelUrl ? (
									<AvatarStudioModelViewer modelUrl={model.modelUrl} />
								) : null}
								<div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
									<div>
										<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
											Generated
										</p>
										<p className='mt-1 text-sm font-semibold text-white'>
											{formatDate(model.createdAt)}
										</p>
									</div>
									<div className='flex flex-wrap gap-2'>
										{model.modelUrl ? (
											<a
												href={model.modelUrl}
												target='_blank'
												rel='noreferrer'
												className='rounded-full border border-cyan-300/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/10'
											>
												Open .glb
											</a>
										) : null}
										<Link
											href={`/tryon/model/avatar-studio/${model.id}`}
											className='rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10'
										>
											Details
										</Link>
									</div>
								</div>
							</article>
						))}
					</div>
				) : (
					<div className='rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-300'>
						<p>No completed .glb models are available yet.</p>
						<Link
							href='/tryon/model'
							className='mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-white transition hover:bg-white/10'
						>
							Generate your first model
						</Link>
					</div>
				)}
			</section>
		</main>
	);
}