"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import Loader from "@/components/ui/Loader";

import { ProductCardPublic, type ProductDetails } from "./_components/productCardPublic";
import { authFetch } from "@/lib/auth/authFetch";

type ProductDetailsResponse = {
	status?: string;
	data?: ProductDetails;
	message?: string;
};

export default function ProductIDPage() {
	const params = useParams<{ productId: string }>();
	const productId = params.productId;

	const [product, setProduct] = useState<ProductDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!productId) return;

		const loadProduct = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const response = await authFetch(`/api/products/${productId}`,
					{
						method: "GET",
					},
				);
				const payload = (await response
					.json()
					.catch(() => ({}))) as ProductDetailsResponse;

				if (!response.ok) {
					throw new Error(payload.message || "Failed to fetch product details");
				}

				if (!payload.data) {
					throw new Error("Product details are missing in response");
				}

				setProduct(payload.data);
			} catch (requestError) {
				setError(
					requestError instanceof Error
						? requestError.message
						: "Failed to fetch product details",
				);
			} finally {
				setIsLoading(false);
			}
		};

		void loadProduct();
	}, [productId]);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<main className='mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8'>
			{error ? (
				<div className='rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200'>
					{error}
				</div>
			) : null}

			{product ? <ProductCardPublic product={product} /> : null}
		</main>
	);
}
