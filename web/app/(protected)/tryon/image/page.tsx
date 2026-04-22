"use client";

import Image from "next/image";
import Link from "next/link";

import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";
import { authFetch } from "@/lib/auth/authFetch";
import { useState } from "react";
import { ProductDetails } from "@/app/(public)/discover/[productId]/_components/productCardPublic";

export default function TryOnImagePage() {
	const [tryonProducts, setTryonProducts] = useState<ProductDetails[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedProducts = useSelectedProductsStore(
		(state) => state.selectedProducts,
	);
	const unselectProduct = useSelectedProductsStore(
		(state) => state.unselectProduct,
	);
	const clearSelectedProducts = useSelectedProductsStore(
		(state) => state.clearSelectedProducts,
	);

	const handleGenerateTryOn = async () => {
		setIsLoading(true);
		setError(null);

		const jobPayload = await authFetch("/api/tryon/image/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				productIds: tryonProducts.map((product) => product.id),
			}),
		});

		if (!jobPayload.ok) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		const { tryonResultId } = await jobPayload.json();

		if (!tryonResultId) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		// Store the try-on result ID in localStorage for retrieval on the result page
		localStorage.setItem("tryonResultId", tryonResultId);

		// Navigate to the try-on result page
		window.location.href = `/tryon/result/${tryonResultId}`;
		// Clear selected products after generating try-on
		clearSelectedProducts();
	};

	return (
		<div className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'></div>
	);
}
