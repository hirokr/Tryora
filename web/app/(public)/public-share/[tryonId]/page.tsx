import Image from "next/image";
import Link from "next/link";

import { BACKEND_URL } from "@/constants/constants";

type TryonItemResponse = {
	status?: string;
	message?: string;
	data?: {
		id?: string;
		userId?: string;
		resultUrl?: string | null;
		productIds?: string[];
		tryonType?: string;
		provider?: string | null;
		createdAt?: string;
	};
};

type PublicSharePageProps = {
	params: Promise<{
		tryonId: string;
	}>;
};

function formatDate(value?: string) {
	if (!value) return "Unknown date";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Unknown date";

	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
	const { tryonId } = await params;

	let tryon: TryonItemResponse | null = null;
	let requestError: string | null = null;

	try {
		const response = await fetch(`${BACKEND_URL}/api/tryon/public/${tryonId}`, {
			method: "GET",
			cache: "no-store",
		});
		const payload = (await response.json().catch(() => ({}))) as TryonItemResponse;

		if (!response.ok) {
			requestError = payload.message || "Could not load the shared try-on.";
		} else {
			tryon = payload;
		}
	} catch {
		requestError = "Could not load the shared try-on.";
	}

	const record = tryon?.data;
	const imageUrl = record?.resultUrl || null;
	const createdAtLabel = formatDate(record?.createdAt);
	const productCount = record?.productIds?.length || 0;

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
				<div className='rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(21,17,36,0.98),rgba(8,8,17,0.98))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.3)] sm:p-8'>
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div>
						<p className='text-xs uppercase tracking-[0.2em] text-cyan-100'>Public share</p>
						<h1 className='mt-2 font-serif text-3xl sm:text-4xl'>Shared try-on preview</h1>
						<p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>
							This page is public, so anyone with the link can open it in a browser without signing in.
						</p>
					</div>

					<div className='rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100'>
						Public link
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
							<div className='relative aspect-4/3 bg-black/30'>
								{imageUrl ? (
									<Image
										src={imageUrl}
										alt='Shared try-on result preview'
										width={480}
										height={560}
										unoptimized
										className='object-fill'
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
									Try-on ID: <span className='break-all font-semibold text-white'>{record?.id || tryonId}</span>
								</p>
								<p className='mt-2 text-sm text-slate-300'>
									Type: <span className='font-semibold text-white'>{record?.tryonType || "Try-on"}</span>
								</p>
							</div>
						</article>

						<aside className='space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5'>
							<div>
								<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>Products</p>
								<h2 className='mt-2 text-xl font-semibold text-white'>Linked item IDs</h2>
							</div>

							{record?.productIds?.length ? (
								<div className='flex flex-wrap gap-2'>
									{record.productIds.map((productId) => (
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
									This shared try-on does not have linked product IDs in the stored record.
								</p>
							)}

							<div className='rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-slate-300'>
								<p>
									You can open this link on desktop or mobile and share it through messaging apps, email, or social media.
								</p>
							</div>
						</aside>
					</section>
				) : null}

				<div className='mt-8 flex flex-wrap gap-3'>
					<Link
						href='/'
						className='rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10'
					>
						Back to home
					</Link>
				</div>
			</div>
		</main>
	);
}