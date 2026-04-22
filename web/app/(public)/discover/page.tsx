"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/authFetch";
import { Product } from "@/types/product";
import { BACKEND_URL } from "@/constants/constants";
import Loader from "@/components/ui/Loader";
import {
	ProductCardPublic,
	type ProductDetails,
} from "./[productId]/_components/productCardPublic";

const PAGE_SIZE = 8;

export default function StyleDiscoveryPage() {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [recommendations, setRecommendations] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const loaderRef = useRef<HTMLDivElement | null>(null);

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

	const fetchProducts = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch(`${BACKEND_URL}/api/products/discover`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch products");
			}
			console.log(response);

			const data = (await response.json().catch(() => ({}))) as {
				results?: Product[];
			};
			setProducts(data.results ?? []);
			setVisibleCount(PAGE_SIZE);
		} catch {
			setError("An error occurred while fetching products");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const hasMore = visibleCount < products.length;

	const visibleProducts = useMemo(
		() => products.slice(0, visibleCount),
		[products, visibleCount],
	);

	const loadMore = useCallback(() => {
		if (isLoading || !hasMore) {
			return;
		}

		setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, products.length));
	}, [hasMore, isLoading, products.length]);

	useEffect(() => {
		if (!loaderRef.current || !hasMore || isLoading) {
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
	}, [hasMore, isLoading, loadMore]);

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

	useEffect(() => {
		void fetchProducts();

		if (isAuthenticated) {
			void getRecomendations();
		}
	}, [fetchProducts, getRecomendations, isAuthenticated]);

	const refreshProducts = () => {
		void fetchProducts();
	};

	if (isLoading) {
		return <Loader />;
	}

	return (
		<section className='relative mx-auto w-full max-w-5xl px-4 pb-14 pt-28 sm:px-6 lg:px-8'>
			<div className='rounded-2xl border border-white/10 bg-[#14131a] p-6 text-white'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Discover
				</p>
				<h1 className='mt-2 text-2xl font-bold'>Product discovery</h1>
				<p className='mt-2 text-sm text-slate-300'>
					{isAuthLoading || isLoading
						? "Loading products..."
						: `${visibleProducts.length} of ${products.length} products loaded`}
				</p>
				{isAuthenticated ? (
					<p className='mt-1 text-sm text-slate-400'>
						{recommendations.length} recommendations ready
					</p>
				) : null}
				{error ? <p className='mt-2 text-sm text-red-300'>{error}</p> : null}
				<button
					type='button'
					onClick={refreshProducts}
					className='mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-white hover:bg-primary/20'
				>
					Refresh products
				</button>

				<div className='mt-8 space-y-6'>
					{visibleProducts.map((product, index) => {
						const normalized = toProductDetails(product, index);

						return (
							<ProductCardPublic key={normalized.id} product={normalized} />
						);
					})}

					{products.length === 0 && !error ? (
						<p className='text-sm text-slate-400'>No products found.</p>
					) : null}

					{hasMore ? (
						<p className='text-sm text-slate-300'>Scroll to load more products...</p>
					) : null}
					{!hasMore && products.length > 0 ? (
						<p className='text-sm text-slate-400'>You have reached the end.</p>
					) : null}
					<div ref={loaderRef} className='h-3' aria-hidden='true' />
				</div>
			</div>
		</section>
	);
}
