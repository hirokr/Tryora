import Link from "next/link";

import { AvatarStudioModelViewer } from "@/components/utility/avatar/studio/AvatarStudioModelViewer";
import { authFetch } from "@/lib/auth/authFetch";

type AvatarStudioJobResponse = {
	success?: boolean;
	status?: string;
	jobId?: string;
	jobType?: string;
	outputresultUrl?: string;
	outputResultUrl?: string;
	data?: {
		id?: string;
		userId?: string;
		status?: string;
		jobType?: string;
		resultUrl?: string | null;
		outputresultUrl?: string | null;
		outputResultUrl?: string | null;
		productIds?: string[];
		tryonType?: string;
		provider?: string | null;
		createdAt?: string;
		updatedAt?: string;
		completedAt?: string | null;
		tryonData?: {
			id?: string;
			userId?: string;
			resultUrl?: string | null;
			productIds?: string[];
			tryonType?: string;
			provider?: string | null;
			createdAt?: string;
			updatedAt?: string;
			completedAt?: string | null;
		};
	};
	message?: string;
};

type ResolvedJobDetails = {
	id: string;
	jobId: string;
	jobType: string;
	status: string;
	outputResultUrl: string | null;
	userId: string | null;
	createdAt: string | null;
	completedAt: string | null;
	productIds: string[];
	resultUrl: string | null;
};

function formatLabel(value?: string | null) {
	if (!value) return "Unknown";

	return value
		.toLowerCase()
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatDate(value?: string | null) {
	if (!value) return "Unknown";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Unknown";

	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function resolveJobDetails(
	payload: AvatarStudioJobResponse | null,
	jobId: string,
): ResolvedJobDetails {
	const data = payload?.data || {};
	const tryonData = data.tryonData || {};
	const outputResultUrl =
		(typeof data.outputResultUrl === "string" && data.outputResultUrl) ||
		(typeof data.outputresultUrl === "string" && data.outputresultUrl) ||
		(typeof payload?.outputResultUrl === "string" && payload.outputResultUrl) ||
		(typeof payload?.outputresultUrl === "string" && payload.outputresultUrl) ||
		(typeof tryonData.resultUrl === "string" && tryonData.resultUrl) ||
		null;

	const resultUrl =
		(typeof data.resultUrl === "string" && data.resultUrl) ||
		(typeof tryonData.resultUrl === "string" && tryonData.resultUrl) ||
		null;

	return {
		id: data.id || payload?.jobId || jobId,
		jobId: payload?.jobId || jobId,
		jobType: data.jobType || payload?.jobType || data.tryonType || "UNKNOWN",
		status: data.status || payload?.status || "UNKNOWN",
		outputResultUrl,
		userId: data.userId || null,
		createdAt: data.createdAt || tryonData.createdAt || null,
		completedAt: data.completedAt || tryonData.completedAt || null,
		productIds: data.productIds || tryonData.productIds || [],
		resultUrl,
	};
}

type AvatarStudioDetailsPageProps = {
	params: Promise<{
		tryonId: string;
	}>;
};

export default async function AvatarStudioDetailsPage({
	params,
}: AvatarStudioDetailsPageProps) {
	const { tryonId } = await params;

	let job: AvatarStudioJobResponse | null = null;
	let requestError: string | null = null;

	try {
		const response = await authFetch(`/api/tryon/jobs/${tryonId}`, {
			method: "GET",
			cache: "no-store",
		});
		const payload = (await response.json().catch(() => ({}))) as AvatarStudioJobResponse;

		if (!response.ok) {
			requestError = payload.message || "Could not load Avatar Studio job.";
		} else {
			job = payload;
		}
	} catch {
		requestError = "Could not load Avatar Studio job.";
	}

	const resolvedJob = resolveJobDetails(job, tryonId);
	const modelUrl = resolvedJob.outputResultUrl;
	const statusTone =
		resolvedJob.status === "COMPLETED"
			? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
			: resolvedJob.status === "FAILED"
				? "border-rose-400/25 bg-rose-400/10 text-rose-100"
				: resolvedJob.status === "CANCELLED"
					? "border-slate-400/25 bg-slate-400/10 text-slate-100"
					: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<section className='overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,18,38,0.96),rgba(13,10,25,0.96))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8'>
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div className='max-w-3xl space-y-4'>
						<p className='text-xs uppercase tracking-[0.2em] text-cyan-100'>
							Avatar Studio
						</p>
						<h1 className='font-serif text-3xl sm:text-4xl'>3D model preview</h1>
						<p className='text-sm leading-6 text-slate-300 sm:text-base'>
							This page loads the try-on job by id and renders the generated 3D
							model when the backend returns a model URL.
						</p>
					</div>

					<div className='flex flex-wrap gap-2'>
						<span
							className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone}`}
						>
							{resolvedJob.status}
						</span>
						<span className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200'>
							{formatLabel(resolvedJob.jobType)}
						</span>
					</div>
				</div>

				{requestError ? (
					<div className='mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100'>
						{requestError}
					</div>
				) : null}

				{job ? (
					<div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]'>
						<div className='space-y-4'>
							{modelUrl ? (
								<AvatarStudioModelViewer modelUrl={modelUrl} />
							) : (
								<div className='flex min-h-104 items-center justify-center rounded-4xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(140,43,238,0.18),transparent_60%),linear-gradient(180deg,rgba(11,10,18,0.98),rgba(8,8,14,0.98))] p-8 text-center'>
									<div className='max-w-sm space-y-3'>
										<div className='mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200' />
										<p className='text-lg font-medium text-white'>
											Waiting for the 3D model
										</p>
										<p className='text-sm text-slate-300'>
											The job is still being resolved. Refresh this page once the
											model URL is available.
										</p>
									</div>
								</div>
							)}

							<div className='grid gap-4 sm:grid-cols-2'>
								<div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
									<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
										Source job
									</p>
									<p className='mt-2 break-all text-sm font-semibold text-white'>
										{resolvedJob.jobId}
									</p>
									<p className='mt-2 text-sm text-slate-300'>
										Job id used to fetch the model details.
									</p>
								</div>

								<div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
									<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
										Model URL
									</p>
									{modelUrl ? (
										<a
											href={modelUrl}
											target='_blank'
											rel='noreferrer'
											className='mt-2 block break-all text-sm font-semibold text-cyan-100 underline decoration-cyan-200/40 underline-offset-4 hover:text-cyan-50'
										>
											Open generated model
										</a>
									) : (
										<p className='mt-2 text-sm text-slate-300'>
											The backend has not returned a model URL yet.
										</p>
									)}
								</div>
							</div>
						</div>

						<aside className='space-y-4 rounded-4xl border border-white/10 bg-white/5 p-5'>
							<div>
								<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
									Job details
								</p>
								<h2 className='mt-2 text-xl font-semibold text-white'>
									Model generation record
								</h2>
							</div>

							<dl className='space-y-4 text-sm'>
								<div className='flex items-start justify-between gap-4 border-b border-white/10 pb-3'>
									<dt className='text-slate-400'>Record ID</dt>
									<dd className='break-all text-right font-medium text-white'>
										{resolvedJob.id || "-"}
									</dd>
								</div>
								<div className='flex items-start justify-between gap-4 border-b border-white/10 pb-3'>
									<dt className='text-slate-400'>Status</dt>
									<dd className='text-right font-medium text-white'>
										{resolvedJob.status}
									</dd>
								</div>
								<div className='flex items-start justify-between gap-4 border-b border-white/10 pb-3'>
									<dt className='text-slate-400'>Created</dt>
									<dd className='text-right font-medium text-white'>
										{formatDate(resolvedJob.createdAt)}
									</dd>
								</div>
								<div className='flex items-start justify-between gap-4 border-b border-white/10 pb-3'>
									<dt className='text-slate-400'>Completed</dt>
									<dd className='text-right font-medium text-white'>
										{formatDate(resolvedJob.completedAt)}
									</dd>
								</div>
								<div className='flex items-start justify-between gap-4 border-b border-white/10 pb-3'>
									<dt className='text-slate-400'>User ID</dt>
									<dd className='break-all text-right font-medium text-white'>
										{resolvedJob.userId || "-"}
									</dd>
								</div>
								<div className='flex items-start justify-between gap-4'>
									<dt className='text-slate-400'>Linked products</dt>
									<dd className='text-right font-medium text-white'>
										{resolvedJob.productIds.length || 0}
									</dd>
								</div>
							</dl>

							{resolvedJob.productIds.length > 0 ? (
								<div className='rounded-2xl border border-white/10 bg-black/20 p-4'>
									<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
										Linked product IDs
									</p>
									<div className='mt-3 flex flex-wrap gap-2'>
										{resolvedJob.productIds.map((productId) => (
											<span
												key={productId}
												className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200'
											>
												{productId}
											</span>
										))}
									</div>
								</div>
							) : null}

							<div className='flex flex-wrap gap-3'>
								<Link
									href='/tryon/model'
									className='rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10'
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
						</aside>
					</div>
				) : null}

				{!job && !requestError ? (
					<div className='mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300'>
						No Avatar Studio job is available for this id yet.
					</div>
				) : null}
			</section>
		</main>
	);
}