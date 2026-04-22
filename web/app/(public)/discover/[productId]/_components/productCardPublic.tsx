"use client";

import Image from "next/image";
import Link from "next/link";

import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";

export type ProductVariant = {
	imageUrl: string | null;
	variantData: string | null;
};

export type ProductDetails = {
	id: string;
	title: string;
	source: string | null;
	defaultImageUrl: string | null;
	googlelink: string | null;
	price: string | null;
	rating: number | null;
	ratingCount: number | null;
	viewCount: number;
	likeCount: number;
	variants: ProductVariant[];
};

type ProductCardProps = {
	product: ProductDetails;
};

const showText = (
	value: string | number | null | undefined,
	fallback = "Not available",
) => {
	if (value === null || value === undefined || value === "") {
		return fallback;
	}

	return String(value);
};

export function ProductCardPublic({ product }: ProductCardProps) {
	const toggleProduct = useSelectedProductsStore(
		(state) => state.toggleProduct,
	);
	const isProductSelected = useSelectedProductsStore((state) =>
		state.selectedProducts.some((item) => item.id === product.id),
	);

	const handleSelectProduct = () => {
		if (!product.id || !product.defaultImageUrl) {
			return;
		}

		toggleProduct({
			id: product.id,
			title: product.title,
			imageUrl: product.defaultImageUrl,
			source: product.source,
			price: product.price,
		});
	};

	return (
		<article className='overflow-hidden rounded-2xl border border-primary/20 bg-white/5 text-white'>
			<div className='relative aspect-video bg-black/30'>
				{product.defaultImageUrl ? (
					<Image
						src={product.defaultImageUrl}
						alt={product.title}
						fill
						sizes='(max-width: 1024px) 100vw, 1024px'
						className='h-full w-full object-cover'
					/>
				) : (
					<div className='flex h-full items-center justify-center text-sm text-slate-400'>
						No image available
					</div>
				)}
			</div>

			<div className='flex flex-col gap-6 p-6'>
				<div>
					<p className='text-xs uppercase tracking-[0.2em] text-primary'>
						Product Details
					</p>
					<h1 className='mt-2 text-2xl font-bold'>{product.title}</h1>
					<p className='mt-1 text-sm text-slate-300'>ID: {product.id}</p>
				</div>

				<dl className='grid grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-2'>
					<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Source
						</dt>
						<dd className='mt-1 font-medium'>{showText(product.source)}</dd>
					</div>
					<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Price
						</dt>
						<dd className='mt-1 font-medium'>{showText(product.price)}</dd>
					</div>
					<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Rating
						</dt>
						<dd className='mt-1 font-medium'>{showText(product.rating)}</dd>
					</div>
					<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Rating Count
						</dt>
						<dd className='mt-1 font-medium'>
							{showText(product.ratingCount)}
						</dd>
					</div>
					<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Like Count
						</dt>
						<dd className='mt-1 font-medium'>
							{showText(product.likeCount, "0")}
						</dd>
					</div>
					<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							View Count
						</dt>
						<dd className='mt-1 font-medium'>
							{showText(product.viewCount, "0")}
						</dd>
					</div>
				</dl>

				<div className='flex flex-wrap items-center gap-2'>
					{product.googlelink ? (
						<a
							href={product.googlelink}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90'
						>
							Open Google listing
						</a>
					) : null}

					<Link
						href='/discover'
						className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10'
					>
						Back to discover
					</Link>

					<button
						type='button'
						onClick={handleSelectProduct}
						disabled={!product.defaultImageUrl}
						className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isProductSelected ? "Selected" : "Select for try-on"}
					</button>
				</div>

				<section>
					<h2 className='text-lg font-semibold'>
						Variants ({product.variants.length})
					</h2>

					{product.variants.length === 0 ? (
						<p className='mt-2 text-sm text-slate-300'>
							No variant details available.
						</p>
					) : (
						<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
							{product.variants.map((variant, index) => (
								<div
									key={`${variant.imageUrl || "variant"}-${index}`}
									className='overflow-hidden rounded-xl border border-white/10 bg-black/20'
								>
									<div className='relative aspect-4/3 bg-black/40'>
										{variant.imageUrl ? (
											<Image
												src={variant.imageUrl}
												alt={`${product.title} variant ${index + 1}`}
												fill
												sizes='(max-width: 640px) 100vw, 50vw'
												className='h-full w-full object-cover'
											/>
										) : (
											<div className='flex h-full items-center justify-center text-xs text-slate-400'>
												No variant image
											</div>
										)}
									</div>
									<div className='p-3 text-sm text-slate-200'>
										<p className='text-xs uppercase tracking-wide text-slate-400'>
											Variant data
										</p>
										<p className='mt-1 wrap-break-word'>
											{showText(variant.variantData)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</article>
	);
}
