"use client";

import Image from "next/image";
import Link from "next/link";

import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";

export default function TryOnImagePage() {
	const selectedProducts = useSelectedProductsStore(
		(state) => state.selectedProducts,
	);
	const unselectProduct = useSelectedProductsStore(
		(state) => state.unselectProduct,
	);
	const clearSelectedProducts = useSelectedProductsStore(
		(state) => state.clearSelectedProducts,
	);

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<section className='rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white sm:p-8'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Try-On Selection
				</p>
				<h1 className='mt-2 text-2xl font-bold'>
					Selected products for try-on
				</h1>
				<p className='mt-2 text-sm text-slate-300'>
					These items are saved in local storage and reused next time you open
					this page.
				</p>

				<div className='mt-4 flex flex-wrap gap-2'>
					<Link
						href='/discover'
						className='rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10'
					>
						Add more products
					</Link>
					<Link
						href='/outfit-comparison'
						className='rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10'
					>
						Go to comparison
					</Link>
					<button
						type='button'
						onClick={clearSelectedProducts}
						disabled={selectedProducts.length === 0}
						className='rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60'
					>
						Clear all
					</button>
				</div>
			</section>

			{selectedProducts.length === 0 ? (
				<section className='mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-300'>
					No selected products yet. Use the Select button on product cards to
					add items.
				</section>
			) : (
				<section className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
					{selectedProducts.map((product) => (
						<article
							key={product.id}
							className='overflow-hidden rounded-2xl border border-primary/20 bg-white/5'
						>
							<div className='relative aspect-4/3 bg-black/30'>
								<Image
									src={product.imageUrl}
									alt={product.title}
									fill
									sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
									className='h-full w-full object-cover'
								/>
							</div>
							<div className='space-y-2 p-3'>
								<p className='line-clamp-2 text-sm font-semibold text-white'>
									{product.title}
								</p>
								<p className='text-xs text-slate-400'>
									{product.source || "Fashion"}
								</p>
								<p className='text-xs text-slate-400'>
									{product.price || "Price unavailable"}
								</p>
								<button
									type='button'
									onClick={() => unselectProduct(product.id)}
									className='inline-flex items-center rounded-lg border border-slate-500/50 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-400'
								>
									Remove
								</button>
							</div>
						</article>
					))}
				</section>
			)}
		</main>
	);
}
