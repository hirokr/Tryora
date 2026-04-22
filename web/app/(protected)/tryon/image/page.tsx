"use client";

import Image from "next/image";

import { useAuth } from "@/context/auth.context";
import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";
import { authFetch } from "@/lib/auth/authFetch";
import { useEffect, useMemo, useState } from "react";
import { useTryonSocket } from "@/context/tryonSocket.context";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "./_components/product";

type QueueJobResponse = {
	jobId?: string;
	message?: string;
};

export default function TryOnImagePage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [locallySelectedProductIds, setLocallySelectedProductIds] = useState<
		string[]
	>([]);
	const { connectIfNeeded, subscribeToJob } = useTryonSocket();
	const { user } = useAuth();

	const selectedProducts = useSelectedProductsStore(
		(state) => state.selectedProducts,
	);

	useEffect(() => {
		void connectIfNeeded();
	}, [connectIfNeeded]);

	const availableProductIdSet = useMemo(
		() => new Set(selectedProducts.map((product) => product.id)),
		[selectedProducts],
	);

	const activeLocalSelectedProductIds = useMemo(
		() =>
			locallySelectedProductIds.filter((id) => availableProductIdSet.has(id)),
		[locallySelectedProductIds, availableProductIdSet],
	);

	const handleToggleLocalSelection = (productId: string) => {
		setLocallySelectedProductIds((currentIds) => {
			if (currentIds.includes(productId)) {
				return currentIds.filter((id) => id !== productId);
			}

			return [...currentIds, productId];
		});
	};

	const handleGenerateTryOn = async () => {
		setIsLoading(true);
		setError(null);

		const jobPayload = await authFetch("/api/tryon/image/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				productIds: activeLocalSelectedProductIds,
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
		setLocallySelectedProductIds([]);
		setIsLoading(false);
	};

	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<section className='grid gap-6 lg:grid-cols-[320px_1fr]'>
				<article className='overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-white'>
					<div className='border-b border-white/10 px-4 py-3'>
						<p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
							User Image
						</p>
						<h2 className='mt-1 text-sm font-semibold'>Your profile image</h2>
					</div>
					<div className='relative aspect-square bg-black/40'>
						{user?.avatarUrl || user?.userBodyImageUrl ? (
							<Image
								src={user.avatarUrl || user.userBodyImageUrl || ""}
								alt={user?.name ? `${user.name} profile image` : "User image"}
								fill
								sizes='(max-width: 1024px) 100vw, 320px'
								className='object-cover'
							/>
						) : (
							<div className='flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-400'>
								Add a profile image in your account to preview the try-on.
							</div>
						)}
					</div>
				</article>

				<section className='rounded-2xl border border-white/10 bg-black/20 p-6 text-white'>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<p className='text-sm text-slate-300'>
								Locally selected products:{" "}
								{activeLocalSelectedProductIds.length}
							</p>
							<p className='mt-1 text-xs text-slate-400'>
								Selection here is local to this page only.
							</p>
						</div>
						<Button
							onClick={() => {
								void handleGenerateTryOn();
							}}
							disabled={isLoading || activeLocalSelectedProductIds.length === 0}
						>
							{isLoading ? "Queuing..." : "Start image try-on"}
						</Button>
					</div>

					{error ? <p className='mt-3 text-sm text-red-300'>{error}</p> : null}
				</section>
			</section>

			<section className='mt-6 grid gap-6'>
				{selectedProducts.length > 0 ? (
					<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{selectedProducts.map((product) => (
							<ProductPreview
								key={product.id}
								product={product}
								isSelected={activeLocalSelectedProductIds.includes(product.id)}
								onToggleSelect={(selectedProduct) => {
									handleToggleLocalSelection(selectedProduct.id);
								}}
							/>
						))}
					</div>
				) : (
					<div className='rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-400'>
						Select a product to see the product image and your image here.
					</div>
				)}
			</section>
		</main>
	);
}
