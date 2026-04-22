"use client";

import { useCallback, useEffect, useState } from "react";

import { ProductCard } from "@/components/utility/product/ProductCard";
import { authFetch } from "@/lib/auth/authFetch";

type UserLocation = {
	latitude: number;
	longitude: number;
	country: string | null;
};

type ProductVariant = {
	id: string;
	title: string;
	price: string;
	imageUrl: string;
};

type SearchResult = {
	id: string;
	searchId: string;
	title: string;
	source: string;
	googlelink: string;
	price: string;
	defaultImageUrl: string;
	rating: number;
	ratingCount: number;
	viewCount?: number;
	likeCount?: number;
	variants?: ProductVariant[];
};

type SearchResponse = {
	status: string;
	intentKey: string;
	searchId: string;
	results: SearchResult[];
};

export default function SearchPage() {
	const [prompt, setPrompt] = useState("");
	const [location, setLocation] = useState<UserLocation | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [products, setProducts] = useState<SearchResult[]>([]);

	const handleSearch = useCallback(async () => {
		if (!prompt.trim()) return;

		setLoading(true);
		setError("");

		try {
			const response = await authFetch("/api/search/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userInput: prompt,
					location: location?.country,
				}),
			});

			const data = (await response.json().catch(() => ({}))) as
				| SearchResponse
				| { message?: string };

			if (!response.ok) {
				throw new Error(
					"message" in data && data.message
						? data.message
						: `Search failed (${response.status})`,
				);
			}

			if (!("results" in data) || !Array.isArray(data.results)) {
				throw new Error("Invalid search response");
			}

			const normalizedProducts = data.results.map((item: SearchResult) => ({
				...item,
				viewCount: item.viewCount ?? 0,
				likeCount: item.likeCount ?? 0,
				variants: item.variants ?? [],
			}));

			setProducts(normalizedProducts);
		} catch (searchError) {
			setError(
				searchError instanceof Error
					? searchError.message
					: "An error occurred during search",
			);
		} finally {
			setLoading(false);
		}
	}, [prompt, location]);

	const handleDetectLocation = useCallback(async () => {
		if (!navigator.geolocation) {
			setError("Geolocation is not supported by your browser");
			return;
		}

		setError("");

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				const res = await fetch(
					`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
				);

				const data = await res.json();
				const country = data.address?.country || null;
				setLocation({ latitude, longitude, country });
			},
			(geoError) => {
				setError(
					geoError instanceof GeolocationPositionError
						? geoError.message
						: "Failed to detect location",
				);
			},
		);
	}, []);

	useEffect(() => {
		void handleDetectLocation();
	}, [handleDetectLocation]);

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-32 pt-24 sm:px-6 sm:pb-36 lg:px-8'>
			<section className='rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white shadow-lg shadow-black/20 sm:p-8'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					AI Search
				</p>
				<h1 className='mt-2 text-3xl font-bold'>Find styles instantly</h1>
				<p className='mt-2 text-sm text-slate-300'>
					Search with prompt + your location for better local recommendations.
				</p>

				<div className='mt-6 space-y-3'>
					<textarea
						value={prompt}
						onChange={(event) => setPrompt(event.target.value)}
						placeholder='Try: modern black cocktail dress under 150'
						className='min-h-40 w-full rounded-xl border border-primary/20 bg-black/20 px-4 py-4 text-base text-white outline-none focus:border-primary'
					/>

					<div className='flex flex-wrap items-center gap-3'>
						<button
							type='button'
							onClick={handleSearch}
							disabled={loading || !prompt.trim()}
							className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
						>
							{loading ? "Searching..." : "Run AI Search"}
						</button>
					</div>

					{location ? (
						<p className='mt-3 text-xs text-emerald-300'>
							Location: {location.country || "Unknown country"} (
							{location.latitude.toFixed(3)}, {location.longitude.toFixed(3)})
						</p>
					) : null}

					{error ? <p className='mt-3 text-sm text-red-300'>{error}</p> : null}
				</div>
			</section>

			<section className='mt-8'>
				<h2 className='mb-4 text-lg font-semibold text-white'>Products</h2>

				{products.length === 0 ? (
					<p className='text-sm text-slate-300'>No products yet. Run a search.</p>
				) : (
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{products.map((product, index) => (
							<ProductCard
								key={product.id || `${product.title}-${index}`}
								id={product.id}
								title={product.title}
								source={product.source}
								defaultImageUrl={product.defaultImageUrl}
								price={product.price}
								rating={product.rating}
								ratingCount={product.ratingCount}
								viewCount={product.viewCount ?? 0}
								likeCount={product.likeCount ?? 0}
								variants={product.variants ?? []}
							/>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
