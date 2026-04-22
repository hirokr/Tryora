"use client";

import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";
import { authFetch } from "@/lib/auth/authFetch";
import { useEffect, useState } from "react";
import { useTryonSocket } from "@/context/tryonSocket.context";
import { Button } from "@/components/ui/button";

type QueueJobResponse = {
	jobId?: string;
	message?: string;
};

export default function TryOnImagePage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { connectIfNeeded, subscribeToJob } = useTryonSocket();

	const selectedProducts = useSelectedProductsStore(
		(state) => state.selectedProducts,
	);
	const clearSelectedProducts = useSelectedProductsStore(
		(state) => state.clearSelectedProducts,
	);

	useEffect(() => {
		void connectIfNeeded();
	}, [connectIfNeeded]);

	const handleGenerateTryOn = async () => {
		setIsLoading(true);
		setError(null);

		const jobPayload = await authFetch("/api/tryon/image/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				productIds: selectedProducts.map((product) => product.id),
			}),
		});

		if (!jobPayload.ok) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		const payload = (await jobPayload
			.json()
			.catch(() => ({}))) as QueueJobResponse;
		const jobId = typeof payload.jobId === "string" ? payload.jobId : "";

		if (!jobId) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		await subscribeToJob(jobId);
		clearSelectedProducts();
		setIsLoading(false);
	};

	return (
		<div className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<div className='rounded-xl border border-white/10 bg-black/20 p-6 text-white'>
				<p className='text-sm text-slate-300'>
					Selected products: {selectedProducts.length}
				</p>
				<Button
					className='mt-4'
					onClick={() => {
						void handleGenerateTryOn();
					}}
					disabled={isLoading || selectedProducts.length === 0}
				>
					{isLoading ? "Queuing..." : "Start image try-on"}
				</Button>
				{error ? <p className='mt-3 text-sm text-red-300'>{error}</p> : null}
			</div>
		</div>
	);
}
