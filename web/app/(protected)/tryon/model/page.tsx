"use client";

import Image from "next/image";
import Link from "next/link";

import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";
import { authFetch } from "@/lib/auth/authFetch";
import { useState } from "react";

type TryOnDetails = {
	id: string;
	resultUrl: string;
	tryonType: string;
};

export default function TryOnModelPage() {
	const [tryonProducts, setTryonProducts] = useState<TryOnDetails[]>([]);
	const [selectedTryon, setSelectedTryon] = useState<TryOnDetails | null>(null);
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

		const jobPayload = await authFetch("/api/tryon/model/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				tryonId: selectedTryon?.id,
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
