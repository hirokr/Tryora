"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth/authFetch";
import type { FeedProduct } from "@/types/feedTypes";
import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";

type ProductVariant = {
	id: string;
	title: string;
	price: string;
	imageUrl: string;
};

type SearchHistoryItem = {
	id: string;
	title: string;
	source: string;
	defaultImageUrl: string;
	price: string;
	rating: number;
	ratingCount: number;
	viewCount: number;
	likeCount: number;
	variants: ProductVariant[];
};

type SearchProductCardProps = {
	product: FeedProduct;
	detailsHref?: string;
	likeCount?: number;
	viewCount?: number;
	isFavorited?: boolean;
	tryOnHref?: string;
	onViewed?: (product: FeedProduct) => void | Promise<void>;
	onLike?: (product: FeedProduct) => void | Promise<void>;
	onFavoriteToggle?: (product: FeedProduct) => void | Promise<void>;
};

const JSON_HEADERS = {
	"Content-Type": "application/json",
};

const postLike = async (productId: string, like: boolean) => {
	return authFetch(`/api/products/like/${productId}`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ like }),
	});
};

const postFavourite = async (productId: string, favourite: boolean) => {
	return authFetch(`/api/products/favourite/${productId}`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ favourite }),
	});
};

const getDisplayPrice = (
	price?: number | string | null,
	currency?: string | null,
) => {
	if (price === null || price === undefined || price === "") {
		return "Price unavailable";
	}

	return `${price}${currency ? ` ${currency}` : ""}`;
};

export function ProductCard({
	id,
	title,
	defaultImageUrl,
	price,
	source,
	likeCount,
	viewCount,
}: SearchHistoryItem) {
	const router = useRouter();
	const toggleProduct = useSelectedProductsStore(
		(state) => state.toggleProduct,
	);
	const isProductSelected = useSelectedProductsStore((state) =>
		id ? state.selectedProducts.some((item) => item.id === id) : false,
	);
	const [isLiked, setIsLiked] = useState(false);
	const [isFavorited, setIsFavorited] = useState(false);
	const [resolvedLikeCount, setResolvedLikeCount] = useState(likeCount ?? 0);
	const [isLikeSaving, setIsLikeSaving] = useState(false);
	const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);

	useEffect(() => {
		setResolvedLikeCount(likeCount ?? 0);
	}, [id, likeCount]);

	const handleLike = async () => {
		if (!id || isLikeSaving) {
			return;
		}

		const nextLike = !isLiked;
		setIsLikeSaving(true);
		setIsLiked(nextLike);
		setResolvedLikeCount((count) => Math.max(0, count + (nextLike ? 1 : -1)));

		try {
			const response = await postLike(id, nextLike);
			if (!response.ok) {
				throw new Error("Failed to update like");
			}
		} catch (error) {
			setIsLiked(!nextLike);
			setResolvedLikeCount((count) => Math.max(0, count + (nextLike ? -1 : 1)));
			console.error("Could not update like", error);
		} finally {
			setIsLikeSaving(false);
		}
	};

	const handleFavoriteToggle = async () => {
		if (!id || isFavoriteSaving) {
			return;
		}

		const nextFavourite = !isFavorited;
		setIsFavoriteSaving(true);
		setIsFavorited(nextFavourite);

		try {
			const response = await postFavourite(id, nextFavourite);
			if (!response.ok) {
				throw new Error("Failed to update favourite");
			}
		} catch (error) {
			setIsFavorited(!nextFavourite);
			console.error("Could not update favourite", error);
		} finally {
			setIsFavoriteSaving(false);
		}
	};

	const destination = id ? `/discover/${id}` : undefined;

	const handleSelectProduct = () => {
		if (!id || !defaultImageUrl) {
			return;
		}

		toggleProduct({
			id,
			title,
			imageUrl: defaultImageUrl,
			source,
			price,
		});
	};

	const handleEditProduct = () => {
		if (!id || !defaultImageUrl) {
			return;
		}

		router.push(`/tryon/image-edit/${id}`);
	};

	return (
		<article className='group overflow-hidden rounded-2xl border border-primary/20 bg-white/5 transition hover:-translate-y-0.5 hover:border-primary/35'>
			<div className='relative aspect-square bg-black/30'>
				{defaultImageUrl ? (
					<Image
						src={defaultImageUrl}
						alt={title}
						fill
						sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
						className='object-cover'
						
					/>
				) : (
					<div className='flex h-full items-center justify-center text-sm text-slate-400'>
						No image
					</div>
				)}

				<div className='absolute inset-x-0 top-0 flex justify-end gap-2 bg-linear-to-b from-black/65 to-transparent p-3'>
					<button
						type='button'
						onClick={() => void handleLike()}
						disabled={isLikeSaving || !id}
						className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow disabled:cursor-not-allowed disabled:opacity-60'
						aria-label='Like product'
					>
						<span className='material-symbols-outlined text-[18px]'>
							{isLiked ? "thumb_up" : "thumb_up_off_alt"}
						</span>
					</button>
					<button
						type='button'
						onClick={() => void handleFavoriteToggle()}
						disabled={isFavoriteSaving || !id}
						className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow disabled:cursor-not-allowed disabled:opacity-60'
						aria-label='Add to favourites'
					>
						<span className='material-symbols-outlined text-[18px]'>
							{isFavorited ? "favorite" : "favorite_border"}
						</span>
					</button>
				</div>
			</div>

			<div className='space-y-3 p-4'>
				<p className='line-clamp-2 text-sm font-semibold text-white'>{title}</p>
				<div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
					<span>{source || "Fashion"}</span>
					<span>{getDisplayPrice(price)}</span>
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
						{viewCount ?? 0}
					</span>
				</div>
				<div className='flex items-center gap-2 pt-1'>
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
						onClick={() => void handleFavoriteToggle()}
						disabled={isFavoriteSaving || !id}
						className='inline-flex items-center rounded-lg border border-slate-500/50 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isFavorited ? "Saved" : "Bookmark"}
					</button>
					<button
						type='button'
						onClick={handleSelectProduct}
						disabled={!id || !defaultImageUrl}
						className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isProductSelected ? "Selected" : "Select"}
					</button>
					<button
						type='button'
						onClick={handleEditProduct}
						disabled={!id || !defaultImageUrl}
						className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60'
					>
						Edit product
					</button>
					
				</div>
			</div>
		</article>
	);
}

export function SearchProductCard({
	product,
	detailsHref,
	likeCount,
	viewCount,
	isFavorited,
	tryOnHref,
	onViewed,
	onLike,
	onFavoriteToggle,
}: SearchProductCardProps) {
	const router = useRouter();
	const toggleProduct = useSelectedProductsStore(
		(state) => state.toggleProduct,
	);
	const isProductSelected = useSelectedProductsStore((state) =>
		product.id
			? state.selectedProducts.some((item) => item.id === product.id)
			: false,
	);
	const [isLiked, setIsLiked] = useState(false);
	const [resolvedLikeCount, setResolvedLikeCount] = useState(
		likeCount ?? product.likeCount ?? 0,
	);
	const [favoriteState, setFavoriteState] = useState(Boolean(isFavorited));
	const [isLikeSaving, setIsLikeSaving] = useState(false);
	const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);

	useEffect(() => {
		setResolvedLikeCount(likeCount ?? product.likeCount ?? 0);
	}, [product.id, likeCount, product.likeCount]);

	useEffect(() => {
		setFavoriteState(Boolean(isFavorited));
	}, [product.id, isFavorited]);

	const destination =
		detailsHref ?? (product.id ? `/discover/${product.id}` : undefined);
	const buyUrl = tryOnHref || product.productUrl || product.link || "#";
	const resolvedViewCount = viewCount ?? product.viewCount ?? 0;

	const handleLike = async () => {
		if (isLikeSaving) {
			return;
		}

		const nextLike = !isLiked;
		setIsLikeSaving(true);
		setIsLiked(nextLike);
		setResolvedLikeCount((count) => Math.max(0, count + (nextLike ? 1 : -1)));

		try {
			if (product.id) {
				const response = await postLike(product.id, nextLike);
				if (!response.ok) {
					throw new Error("Failed to update like");
				}
			}

			await onLike?.(product);
		} catch (error) {
			setIsLiked(!nextLike);
			setResolvedLikeCount((count) => Math.max(0, count + (nextLike ? -1 : 1)));
			console.error("Could not update like", error);
		} finally {
			setIsLikeSaving(false);
		}
	};

	const handleFavoriteToggle = async () => {
		if (isFavoriteSaving) {
			return;
		}

		const nextFavourite = !favoriteState;
		setIsFavoriteSaving(true);
		setFavoriteState(nextFavourite);

		try {
			if (product.id) {
				const response = await postFavourite(product.id, nextFavourite);
				if (!response.ok) {
					throw new Error("Failed to update favourite");
				}
			}

			await onFavoriteToggle?.(product);
		} catch (error) {
			setFavoriteState(!nextFavourite);
			console.error("Could not update favourite", error);
		} finally {
			setIsFavoriteSaving(false);
		}
	};

	const handleViewed = () => {
		void onViewed?.(product);
	};

	const handleSelectProduct = () => {
		if (!product.id || !product.image) {
			return;
		}

		toggleProduct({
			id: product.id,
			title: product.title,
			imageUrl: product.image,
			source: product.source,
			price:
				product.price !== null && product.price !== undefined
					? getDisplayPrice(product.price, product.currency)
					: null,
		});
	};

	const EditProduct = () => {
		if (!product.id || !product.image) {
			return;
		}

		router.push(`/tryon/image-edit/${product.id}`);
	};

	return (
		<article
			onMouseEnter={handleViewed}
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
						onClick={() => void handleLike()}
						disabled={isLikeSaving}
						className='pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow disabled:cursor-not-allowed disabled:opacity-60'
						aria-label='Like product'
					>
						<span className='material-symbols-outlined text-[18px]'>
							{isLiked ? "thumb_up" : "thumb_up_off_alt"}
						</span>
					</button>
					<button
						type='button'
						onClick={() => void handleFavoriteToggle()}
						disabled={isFavoriteSaving}
						className='pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow disabled:cursor-not-allowed disabled:opacity-60'
						aria-label='Add to favourites'
					>
						<span className='material-symbols-outlined text-[18px]'>
							{favoriteState ? "favorite" : "favorite_border"}
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
					<span>{getDisplayPrice(product.price, product.currency)}</span>
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
						onClick={() => void handleFavoriteToggle()}
						disabled={isFavoriteSaving}
						className='inline-flex items-center rounded-lg border border-slate-500/50 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{favoriteState ? "Saved" : "Bookmark"}
					</button>
					<button
						type='button'
						onClick={handleSelectProduct}
						disabled={!product.id || !product.image}
						className='inline-flex items-center rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isProductSelected ? "Selected" : "Select"}
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
