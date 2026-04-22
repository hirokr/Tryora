//** 
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/context/auth.context";
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
	compact?: boolean;
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

export function ProductCardPublic({ product, compact = false }: ProductCardProps) {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const toggleProduct = useSelectedProductsStore(
		(state) => state.toggleProduct,
	);
	const isProductSelected = useSelectedProductsStore((state) =>
		state.selectedProducts.some((item) => item.id === product.id),
	);

	const handleSelectProduct = () => {
		if (!isAuthenticated) {
			const query = searchParams.toString();
			const currentPath = query ? `${pathname}?${query}` : pathname;
			router.push(`/auth/signin?redirectTo=${encodeURIComponent(currentPath)}`);
			return;
		}

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
			<div
				className={`relative bg-black/30 ${compact ? "aspect-[2/1]" : "aspect-video"}`}
			>
				{product.defaultImageUrl ? (
					<Image
						src={product.defaultImageUrl}
						alt={product.title}
						fill
						sizes={compact ? "(max-width: 1024px) 50vw, 33vw" : "(max-width: 1024px) 100vw, 1024px"}
						className='h-full w-full object-cover'
					/>
				) : (
					<div className='flex h-full items-center justify-center text-sm text-slate-400'>
						No image available
					</div>
				)}
			</div>

			<div className={`flex flex-col ${compact ? "gap-3 p-3" : "gap-6 p-6"}`}>
				<div>
					{compact ? null : (
						<p className='text-xs uppercase tracking-[0.2em] text-primary'>
							Product Details
						</p>
					)}
					<h1
						className={`font-bold ${compact ? "line-clamp-1 text-sm" : "mt-2 text-2xl"}`}
					>
						{product.title}
					</h1>
					{compact ? null : (
						<p className='mt-1 text-sm text-slate-300'>ID: {product.id}</p>
					)}
				</div>

				<dl
					className={`grid text-slate-200 ${compact ? "grid-cols-2 gap-2 text-xs" : "grid-cols-1 gap-3 text-sm sm:grid-cols-2"}`}
				>
					<div className={`rounded-lg border border-white/10 bg-black/20 ${compact ? "p-2" : "p-3"}`}>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Source
						</dt>
						<dd className='mt-1 font-medium'>{showText(product.source)}</dd>
					</div>
					<div className={`rounded-lg border border-white/10 bg-black/20 ${compact ? "p-2" : "p-3"}`}>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Price
						</dt>
						<dd className='mt-1 font-medium'>{showText(product.price)}</dd>
					</div>
					{compact ? null : (
						<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Rating
						</dt>
						<dd className='mt-1 font-medium'>{showText(product.rating)}</dd>
						</div>
					)}
					{compact ? null : (
						<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Rating Count
						</dt>
						<dd className='mt-1 font-medium'>
							{showText(product.ratingCount)}
						</dd>
						</div>
					)}
					{compact ? null : (
						<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							Like Count
						</dt>
						<dd className='mt-1 font-medium'>
							{showText(product.likeCount, "0")}
						</dd>
						</div>
					)}
					{compact ? null : (
						<div className='rounded-lg border border-white/10 bg-black/20 p-3'>
						<dt className='text-xs uppercase tracking-wider text-slate-400'>
							View Count
						</dt>
						<dd className='mt-1 font-medium'>
							{showText(product.viewCount, "0")}
						</dd>
						</div>
					)}
				</dl>

				<div className='flex flex-wrap items-center gap-2'>
					{product.googlelink && !compact ? (
						<a
							href={product.googlelink}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90'
						>
							Open Google listing
						</a>
					) : null}

					{compact ? null : (
						<Link
							href='/discover'
							className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10'
						>
							Back to discover
						</Link>
					)}

					<button
						type='button'
						onClick={handleSelectProduct}
						disabled={!product.defaultImageUrl}
						className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isProductSelected ? "Selected" : "Select for try-on"}
					</button>
				</div>

				{compact ? null : (
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
				)}
			</div>
		</article>
	);
} // This component, `ProductCardPublic`, is responsible for displaying detailed information about a specific product on the public product details page. It shows the product's image, title, ID, source, price, rating, like count, and view count. It also provides links to the Google listing (if available) and a button to select the product for try-on. The component uses the `useSelectedProductsStore` to manage the selection state of products for try-on. Additionally, it displays any variants of the product with their respective images and data. The UI is styled with a dark theme consistent with the overall design of the Tryora website.
