"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { SearchProduct } from "@/types/search";

type SearchProductCardProps = {
	product: SearchProduct;
	likeCount?: number;
	viewCount?: number;
	isFavorited?: boolean;
	tryOnHref?: string;
	detailsHref?: string;
	onLike?: (product: SearchProduct) => void | Promise<void>;
	onFavoriteToggle?: (product: SearchProduct) => void;
	onViewed?: (product: SearchProduct) => void | Promise<void>;
};

export function SearchProductCard({
	product,
	likeCount,
	viewCount,
	isFavorited = false,
	tryOnHref,
	detailsHref,
	onLike,
	onFavoriteToggle,
	onViewed,
}: SearchProductCardProps) {
	const hasTrackedViewRef = useRef(false);
	const destination =
		detailsHref || (product.id ? `/search/product/${product.id}` : undefined);
	const buyUrl = product.productUrl || product.link || "#";
	const resolvedLikeCount =
		likeCount ?? Math.max(0, Math.round(product.trendingScore || 0));
	const resolvedViewCount = viewCount ?? 0;

	const handleMouseEnter = () => {
		if (hasTrackedViewRef.current) return;
		hasTrackedViewRef.current = true;
		void onViewed?.(product);
	};

	return (
		<article
			onMouseEnter={handleMouseEnter}
			className='group overflow-hidden rounded-2xl border border-primary/20 bg-white/5 transition hover:-translate-y-0.5 hover:border-primary/35'
		>
			<div className='relative aspect-4/3 bg-black/30'>
				{product.image ? (
					<Image
						src={product.image}
						alt={product.title}
						fill
						sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
						className='h-full w-full object-cover'
					/>
				) : (
					<div className='flex h-full items-center justify-center text-sm text-slate-400'>
						No image
					</div>
				)}

				<div className='pointer-events-none absolute inset-x-0 top-0 flex justify-end gap-2 bg-linear-to-b from-black/65 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100'>
					<button
						type='button'
						onClick={() => void onLike?.(product)}
						className='pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow'
						aria-label='Like product'
					>
						<span className='material-symbols-outlined text-[18px]'>
							thumb_up
						</span>
					</button>
					<button
						type='button'
						onClick={() => onFavoriteToggle?.(product)}
						className='pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow'
						aria-label='Add to favourites'
					>
						<span className='material-symbols-outlined text-[18px]'>
							{isFavorited ? "favorite" : "favorite_border"}
						</span>
					</button>
				</div>
			</div>
			<div className='space-y-3 p-4'>
				<p className='line-clamp-2 text-sm font-semibold text-white'>
					{product.title}
				</p>
				<div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
					<span>{product.brand || product.category || "Fashion"}</span>
					<span>
						{product.price
							? `${product.price} ${product.currency || ""}`.trim()
							: "Price unavailable"}
					</span>
				</div>
				<div className='flex items-center gap-4 text-xs text-slate-300'>
					<span className='inline-flex items-center gap-1'>
						<span className='material-symbols-outlined text-[15px]'>
							thumb_up
						</span>
						{resolvedLikeCount}
					</span>
					<span className='inline-flex items-center gap-1'>
						<span className='material-symbols-outlined text-[15px]'>
							visibility
						</span>
						{resolvedViewCount}
					</span>
				</div>
				<div className='flex items-center gap-2 pt-1'>
					{tryOnHref ? (
						<a
							href={tryOnHref}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center rounded-lg border border-emerald-500/35 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10'
						>
							Try on
						</a>
					) : null}
					{destination ? (
						<Link
							href={destination}
							className='inline-flex items-center rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10'
						>
							View details
						</Link>
					) : null}
					<button
						type='button'
						onClick={() => onFavoriteToggle?.(product)}
						className='inline-flex items-center rounded-lg border border-slate-500/50 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-400'
					>
						{isFavorited ? "Saved" : "Bookmark"}
					</button>
					{buyUrl !== "#" ? (
						<a
							href={buyUrl}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90'
						>
							Open store
						</a>
					) : null}
				</div>
			</div>
		</article>
	);
}
