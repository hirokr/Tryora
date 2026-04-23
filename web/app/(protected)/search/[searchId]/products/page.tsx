"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth/authFetch";
import { ProductCard } from "@/components/utility/product/ProductCard";
// "status": "cached",
// "results": [
//     {
//         "id": "8d6a9490-8f48-4212-aaf7-83e37c5f8ad9",
//         "title": "Pakistani Bridal Dress with Lehenga & Dupatt",
//         "source": "Nameera by Farooq",
//         "defaultImageUrl": "https://fhy3ttdc07.ufs.sh/f/BVSc6zHLyH5XWgiMb4IeDwPzHrb4ZUqFo9JN8ifh0lOLkBET",
//         "price": "$2,550.00",
//         "rating": 0,
//         "ratingCount": 0,
//         "viewCount": 0,
//         "likeCount": 0,
//         "variants": []
//     },

type variant = {
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
	variants: variant[];
};

type SearchHistoryResponse = {
	status: string;
	search: string;
	results: SearchHistoryItem[];
};

export default function SearchProductsPage() {
	const params = useParams<{ searchId: string }>();
	const searchId = params.searchId;
	const [results, setResults] = useState<SearchHistoryResponse>({
		status: "",
		search: "",
		results: [],
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!searchId) return;

		const loadProducts = async () => {
			try {
				const response = await authFetch(`/api/search/${searchId}/products`, {
					method: "GET",
				});
				const payload = (await response
					.json()
					.catch(() => ({}))) as SearchHistoryResponse;

				if (!response.ok) {
					throw new Error("Failed to load products from search id");
				}

				setResults(payload);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load products",
				);
			}
		};

		void loadProducts();
	}, [searchId]);

	return (
		<main className='mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8'>
			<div className='mb-6'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Search Products
				</p>
				<h1 className='mt-2 text-3xl font-bold text-white'>
					Products for search{" "}
					{results.search ? `${results.search}` : searchId}
				</h1>
			</div>
			{error ? <p className='mb-4 text-sm text-red-300'>{error}</p> : null}
			<section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{results?.results?.map((product, index) => (
					<ProductCard
						key={product.id || `${product.title}-${index}`}
						{...product}
					/>
				))}
			</section>
		</main>
	);
}
