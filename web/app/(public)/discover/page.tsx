"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/authFetch";
import { Product } from "@/types/product";
import { BACKEND_URL } from "@/constants/constants";
import Loader from "@/components/ui/Loader";
import { ProductCard } from "@/components/utility/product/ProductCard";
import {
	ProductCardPublic,
	type ProductDetails,
} from "./[productId]/_components/productCardPublic";

const PAGE_SIZE = 8;

export default function StyleDiscoveryPage() {
	const { isAuthenticated } = useAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [recommendations, setRecommendations] = useState<Product[]>([]);
	const [isLoadingInitial, setIsLoadingInitial] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [error, setError] = useState("");
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const loaderRef = useRef<HTMLDivElement | null>(null);
	const discoverGridRef = useRef<HTMLDivElement | null>(null);
	const isFetchingRef = useRef(false);

	const getRecomendations = useCallback(async () => {
		try {
			const response = await authFetch("/api/recommendations");
			if (!response.ok) {
				throw new Error("Failed to fetch recommendations");
			}
			const data = (await response.json().catch(() => ({}))) as {
				recommendations?: Product[];
			};
			setRecommendations(data.recommendations ?? []);
		} catch {
			setError("An error occurred while fetching recommendations");
		}
	}, []);

	const fetchProducts = useCallback(
		async (pageNum: number, options: { reset?: boolean } = {}) => {
			const { reset = false } = options;

			if (isFetchingRef.current) {
				return;
			}

			isFetchingRef.current = true;

			if (reset) {
				setIsLoadingInitial(true);
				setError("");
			} else {
				setIsLoadingMore(true);
			}

			try {
				const skip = (pageNum - 1) * PAGE_SIZE;
				const response = await fetch(
					`${BACKEND_URL}/api/products/discover?limit=${PAGE_SIZE}&skip=${skip}`,
					{
						method: "GET",
					},
				);

				if (!response.ok) {
					throw new Error("Failed to fetch products");
				}

				const data = (await response.json().catch(() => ({}))) as {
					results?: Product[];
				};
				const nextBatch = data.results ?? [];

				setProducts((prev) => (reset ? nextBatch : [...prev, ...nextBatch]));
				setHasMore(nextBatch.length === PAGE_SIZE);
			} catch {
				setError("An error occurred while fetching products");
			} finally {
				isFetchingRef.current = false;
				setIsLoadingInitial(false);
				setIsLoadingMore(false);
			}
		},
		[],
	);

	const loadMore = useCallback(() => {
		if (isLoadingInitial || isLoadingMore || !hasMore) {
			return;
		}

		setPage((prev) => prev + 1);
	}, [hasMore, isLoadingInitial, isLoadingMore]);

	useEffect(() => {
		void fetchProducts(page, { reset: page === 1 });
	}, [fetchProducts, page]);

	useEffect(() => {
		if (!loaderRef.current || !hasMore || isLoadingInitial || isLoadingMore) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMore();
				}
			},
			{ rootMargin: "240px 0px" },
		);

		observer.observe(loaderRef.current);

		return () => {
			observer.disconnect();
		};
	}, [hasMore, isLoadingInitial, isLoadingMore, loadMore]);

	const toProductDetails = useCallback(
		(product: Product, index: number): ProductDetails => {
			const sourceProduct = product as Product & {
				id?: string;
				searchProductId?: string | null;
				viewCount?: number;
				likeCount?: number;
				variants?: Array<{
					imageUrl: string | null;
					variantData: string | null;
				}>;
				defaultImageUrl?: string | null;
			};

			return {
				id:
					sourceProduct.id ||
					sourceProduct.searchProductId ||
					`${sourceProduct.title}-${index}`,
				title: sourceProduct.title,
				source: sourceProduct.source,
				defaultImageUrl: sourceProduct.defaultImageUrl ?? null,
				googlelink: sourceProduct.googlelink,
				price: sourceProduct.price,
				rating: sourceProduct.rating,
				ratingCount: sourceProduct.ratingCount,
				viewCount: sourceProduct.viewCount ?? 0,
				likeCount: sourceProduct.likeCount ?? 0,
				variants: sourceProduct.variants ?? [],
			};
		},
		[],
	);

	const toProductCardData = useCallback((product: Product, index: number) => {
		const sourceProduct = product as Product & {
			id?: string;
			searchProductId?: string | null;
			viewCount?: number;
			likeCount?: number;
			rating?: number | null;
			ratingCount?: number | null;
			variants?: Array<{
				id?: string;
				title?: string;
				price?: string;
				imageUrl?: string | null;
			}>;
			defaultImageUrl?: string | null;
		};

		return {
			id:
				sourceProduct.id ||
				sourceProduct.searchProductId ||
				`${sourceProduct.title}-${index}`,
			title: sourceProduct.title,
			source: sourceProduct.source ?? "Fashion",
			defaultImageUrl: sourceProduct.defaultImageUrl ?? "",
			price: sourceProduct.price ?? "",
			rating: sourceProduct.rating ?? 0,
			ratingCount: sourceProduct.ratingCount ?? 0,
			viewCount: sourceProduct.viewCount ?? 0,
			likeCount: sourceProduct.likeCount ?? 0,
			variants: (sourceProduct.variants ?? []).map((variant, variantIndex) => ({
				id: variant.id || `${sourceProduct.title}-${variantIndex}`,
				title: variant.title || "Variant",
				price: variant.price || sourceProduct.price || "",
				imageUrl: variant.imageUrl ?? sourceProduct.defaultImageUrl ?? "",
			})),
		};
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			void getRecomendations();
		}
	}, [getRecomendations, isAuthenticated]);

	const refreshProducts = () => {
		setHasMore(true);
		setProducts([]);

		if (page === 1) {
			void fetchProducts(1, { reset: true });
			return;
		}

		setPage(1);
	};

	const scrollToDiscoverTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (isLoadingInitial && products.length === 0) {
		return <Loader />;
	}

	return (
		<section className='relative mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8'>
			{isAuthenticated ? (
				<div className='mb-8 rounded-2xl border border-white/10 bg-[#14131a] p-6 text-white'>
					<p className='text-xs uppercase tracking-[0.2em] text-primary'>
						Recommendations
					</p>
					<h2 className='mt-2 text-2xl font-bold'>Recommended for you</h2>
					<div className='mt-4 overflow-x-auto pb-2'>
						<div className='flex gap-4'>
							{recommendations.slice(0, 10).map((product, index) => {
								const normalizedPublic = toProductDetails(product, index);
								const normalizedPrivate = toProductCardData(product, index);

								return (
									<div
										key={`recommendation-${normalizedPublic.id}-${index}`}
										className='w-[280px] shrink-0 md:w-[320px]'
									>
										{isAuthenticated ? (
											<ProductCard {...normalizedPrivate} />
										) : (
											<ProductCardPublic product={normalizedPublic} compact />
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			) : null}

			<div className='rounded-2xl border border-white/10 bg-[#14131a] p-6 text-white'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Discover
				</p>
				<h1 className='mt-2 text-2xl font-bold'>Product discovery</h1>
				{error ? <p className='mt-2 text-sm text-red-300'>{error}</p> : null}
				<div className='mt-4 flex justify-end'>
					<button
						type='button'
						onClick={refreshProducts}
						className='rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-white hover:bg-primary/20'
					>
						Refresh products
					</button>
				</div>
				<div className='mt-8'>
					<div
						ref={discoverGridRef}
						className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
					>
						{products.map((product, index) => {
							const normalizedPublic = toProductDetails(product, index);
							const normalizedPrivate = toProductCardData(product, index);

							return (
								isAuthenticated ? (
									<ProductCard
										key={normalizedPublic.id}
										{...normalizedPrivate}
									/>
								) : (
									<ProductCardPublic
										key={normalizedPublic.id}
										product={normalizedPublic}
										compact
									/>
								)
							);
						})}
					</div>

					{products.length === 0 && !error ? (
						<p className='mt-4 text-sm text-slate-400'>No products found.</p>
					) : null}

					{hasMore ? (
						<>
							{/* infinite scrolling */}
							<p className='mt-4 text-sm text-slate-300'>
								{isLoadingMore
									? "Loading more products..."
									: "Scroll to load more products..."}
							</p>
						</>
					) : null}
					{!hasMore && products.length > 0 ? (
						<p className='mt-4 text-sm text-slate-400'>You have reached the end.</p>
					) : null}
					<div ref={loaderRef} className='h-3' aria-hidden='true' />
				</div>
			</div>

			<button
				type='button'
				onClick={scrollToDiscoverTop}
				className='fixed bottom-6 right-6 z-30 rounded-full border border-primary/40 bg-[#14131a]/90 px-4 py-2 text-lg font-semibold leading-none text-white shadow-lg backdrop-blur hover:bg-primary/20'
				aria-label='Scroll to first row of discover products'
			>
				↑
			</button>
		</section>
	);
}
