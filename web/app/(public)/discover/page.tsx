"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/clientAuthFetch";
import { Product } from "@/types/product";
import { BACKEND_URL } from "@/constants/constants";
import Loader from "@/components/ui/Loader";

export default function StyleDiscoveryPage() {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [recommendations, setRecommendations] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

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
		} catch {
			setError("An error occurred while fetching products");
		} finally {
			setIsLoading(false);
		}
	}, []);

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
						: `${products.length} products loaded`}
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
			</div>
		</section>
	);
}
