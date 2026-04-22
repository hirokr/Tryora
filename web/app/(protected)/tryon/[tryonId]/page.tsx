import Link from "next/link";
import Image from "next/image";

import { authFetch } from "@/lib/auth/authFetch";

type TryonItemResponse = {
	status?: string;
	data?: {
		id?: string;
		userId?: string;
		resultUrl?: string | null;
		productIds?: string[];
		tryonType?: string;
		provider?: string | null;
		createdAt?: string;
	};
	message?: string;
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

	let tryon: TryonItemResponse["data"] | null = null;
	let requestError: string | null = null;

	try {
		const response = await authFetch(`/api/tryon/item/${tryonId}`, {
			method: "GET",
			cache: "no-store",
		});

		if (!response.ok) {
			const payload = (await response.json().catch(() => ({}))) as TryonItemResponse;
			requestError = payload.message || "Could not load try-on result.";
		} else {
			const payload = (await response.json().catch(() => ({}))) as TryonItemResponse;
			tryon = payload.data || null;
		}
	} catch {
		requestError = "Could not load try-on details.";
	}

	const createdAtLabel = tryon?.createdAt
		? new Intl.DateTimeFormat("en", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(tryon.createdAt))
		: "Unknown date";

	const productCount = tryon?.productIds?.length || 0;

	return (
			<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<div className='rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,18,38,0.96),rgba(13,10,25,0.96))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8'>
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div>
						<p className='text-xs uppercase tracking-[0.2em] text-cyan-100'>
							Try-on details
						</p>
						<h1 className='mt-2 font-serif text-3xl sm:text-4xl'>Try-on record preview</h1>
						<p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>
							This page shows the stored try-on result, the linked product IDs, and the metadata saved for the record.
						</p>
					</div>
					<div className='flex flex-wrap gap-2'>
						{tryon?.tryonType ? (
							<span className='rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]'>
								{tryon.tryonType}
							</span>
						) : null}
						{tryon?.provider ? (
							<span className='rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100'>
								{tryon.provider}
							</span>
						) : null}
					</div>
				</div>

				{requestError ? (
					<div className='mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100'>
						{requestError}
					</div>
				) : null}

				{tryon ? (
					<section className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
						<article className='overflow-hidden rounded-3xl border border-white/10 bg-black/20'>
							<div className='relative aspect-[4/3] bg-black/30'>
								{tryon.resultUrl ? (
									<Image
										src={tryon.resultUrl}
										alt='Try-on result preview'
										width={1200}
										height={1200}
										unoptimized
										className='h-full w-full object-cover'
									/>
								) : (
									<div className='flex h-full items-center justify-center px-6 text-center text-sm text-slate-300'>
										No result image was saved for this try-on.
									</div>
								)}
							</div>
							<div className='border-t border-white/10 p-5'>
								<p className='text-sm text-slate-300'>
									Product count: <span className='font-semibold text-white'>{productCount}</span>
								</p>
								<p className='mt-2 text-sm text-slate-300'>
									Created: <span className='font-semibold text-white'>{createdAtLabel}</span>
								</p>
								<p className='mt-2 text-sm text-slate-300'>
									Try-on ID: <span className='break-all font-semibold text-white'>{tryon.id || tryonId}</span>
								</p>
								<p className='mt-2 text-sm text-slate-300'>
									User ID: <span className='break-all font-semibold text-white'>{tryon.userId || "-"}</span>
								</p>
							</div>
						</article>

						<aside className='space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5'>
							<div>
								<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>Products</p>
								<h2 className='mt-2 text-xl font-semibold text-white'>Linked item IDs</h2>
							</div>

							{tryon.productIds && tryon.productIds.length > 0 ? (
								<div className='flex flex-wrap gap-2'>
									{tryon.productIds.map((productId) => (
										<span
											key={productId}
											className='rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200'
										>
											{productId}
										</span>
									))}
								</div>
							) : (
								<p className='rounded-2xl border border-dashed border-white/15 bg-black/10 p-4 text-sm text-slate-300'>
									This try-on does not have linked product IDs in the stored record.
								</p>
							)}

							<div className='rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-slate-300'>
								<p>
									Use this record as a starting point for future edits or for checking how the original try-on was generated.
								</p>
							</div>
						</aside>
					</section>
				) : (
					<div className='mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300'>
						No try-on record is available for this ID yet.
					</div>
				)}

				<div className='mt-8 flex flex-wrap gap-3'>
					<Link
						href='/tryon'
						className='rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10'
					>
						Back to try-on history
					</Link>
					<Link
						href='/tryon/image'
						className='rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200'
					>
						Start another try-on
					</Link>
				</div>
			</div>
		</main>
	);
}
