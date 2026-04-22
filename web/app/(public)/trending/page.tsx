"use client";

import { useCallback, useEffectEvent, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";
import Loader from "@/components/ui/Loader";

type tryonType = {
	id: string;
	resultUrl: string;
	productIds: string[];
	tryonType: string;
	provider: string;
	createdAt: string;
};

export default function StyleDiscoveryPage() {
	const [products, setProducts] = useState<tryonType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const fetchTryons = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch(`${BACKEND_URL}/api/tryon/trending`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch products");
			}

			const data = await response.json();

			setProducts(data);
			setError("");
		} catch {
			setError("An error occurred while fetching products");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffectEvent(() => {
		return () => fetchTryons();
	});

	const refreshProducts = () => {
		void fetchTryons();
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
