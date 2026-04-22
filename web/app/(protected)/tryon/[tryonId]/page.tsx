import Link from "next/link";
import Image from "next/image";

import { authFetch } from "@/lib/auth/authFetch";

type TryonJobApiPayload = {
	success?: boolean;
	data?: {
		jobId?: string;
		status?: string;
		jobType?: string;
		outputresultUrl?: string | null;
		outputResultUrl?: string | null;
	};
};

type TryonDetailsPageProps = {
	params: Promise<{
		tryonId: string;
	}>;
};

export default async function TryonDetailsPage({
	params,
}: TryonDetailsPageProps) {
	const { tryonId } = await params;
	const jobId = tryonId;

	let outputImageUrl: string | null = null;
	let jobStatus: string | null = null;
	let requestError: string | null = null;

	try {
		const response = await authFetch(`/api/tryon/jobs/${jobId}`, {
			method: "GET",
			cache: "no-store",
		});
    console.log("API response status:", response);

		if (!response.ok) {
			requestError = "Could not load try-on result.";
		} else {
			const payload = (await response
				.json()
				.catch(() => ({}))) as TryonJobApiPayload;

			jobStatus = payload.data?.status || null;
			outputImageUrl =
				payload.data?.outputresultUrl || payload.data?.outputResultUrl || null;
		}
	} catch {
		requestError = "Could not load try-on result.";
	}

	return (
		<main className='mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<div className='rounded-2xl border border-white/10 bg-black/20 p-6 text-white'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
							Try-on job
						</p>
						<h1 className='mt-1 text-lg font-semibold'>Result preview</h1>
						<p className='mt-1 text-sm text-slate-300'>Job ID: {jobId}</p>
					</div>
					{jobStatus ? (
						<span className='rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase'>
							{jobStatus}
						</span>
					) : null}
				</div>

				{requestError ? (
					<p className='mt-4 text-sm text-red-300'>{requestError}</p>
				) : null}

				{outputImageUrl ? (
					<div className='mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/30'>
						<Image
							src={outputImageUrl}
							alt='Generated try-on result'
							width={1200}
							height={1200}
							unoptimized
							className='h-auto w-full object-cover'
						/>
					</div>
				) : (
					<p className='mt-4 text-sm text-slate-300'>
						No output image is available for this job yet.
					</p>
				)}

				<div className='mt-6'>
					<Link
						href='/tryon/image'
						className='text-sm font-semibold text-emerald-300 underline'
					>
						Start another try-on
					</Link>
				</div>
			</div>
		</main>
	);
}
