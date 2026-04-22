"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth/authFetch";
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
						className='object-contain h-full w-full origin-top'
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
						className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow disabled:cursor-not-allowed disabled:opacity-60'
						aria-label='Like product'
					>
						<span
							className={`material-symbols-outlined text-[18px] ${
								isLiked ? "text-red-500" : "text-slate-700"
							}`}
							style={{
								fontVariationSettings: isLiked
									? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
									: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
							}}
						>
							thumb_up
						</span>
					</button>
					<button
						type='button'
						onClick={() => void handleFavoriteToggle()}
						disabled={isFavoriteSaving || !id}
						className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow disabled:cursor-not-allowed disabled:opacity-60'
						aria-label='Add to favourites'
					>
						<span
							className={`material-symbols-outlined text-[18px] ${
								isFavorited ? "text-red-500" : "text-slate-700"
							}`}
							style={{
								fontVariationSettings: isFavorited
									? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
									: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
							}}
						>
							favorite
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
