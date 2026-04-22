"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { authFetch } from "@/lib/auth/authFetch";
import {
	ImageEditJobPayload,
	useImageEditJobStore,
} from "@/store/useImageEditJobStore";
import { useTryonSocket } from "@/context/tryonSocket.context";

type ProductDetails = {
	id: string;
	title: string;
	source: string | null;
	price: string | null;
	defaultImageUrl: string;
};

type ProductDetailsResponse = {
	status?: string;
	data?: ProductDetails;
	message?: string;
};

type ImageEditResponse = {
	status?: string;
	jobId?: string;
	jobType?: string;
	JobType?: string;
	message?: string;
};

const MIN_PROMPT_LENGTH = 5;

export default function ProductImageEditPage() {
	const params = useParams<{ productId: string }>();
	const productId = useMemo(
		() => (typeof params.productId === "string" ? params.productId : ""),
		[params.productId],
	);

	const [product, setProduct] = useState<ProductDetails | null>(null);
	const [productError, setProductError] = useState<string | null>(null);
	const [isProductLoading, setIsProductLoading] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { connectIfNeeded, subscribeToJob } = useTryonSocket();

	const saveJob = useImageEditJobStore((state) => state.saveJob);
	const savedProductJob = useImageEditJobStore((state) =>
		productId ? state.jobsByProductId[productId] : undefined,
	);

	useEffect(() => {
		void connectIfNeeded();
	}, [connectIfNeeded]);

	useEffect(() => {
		if (!savedProductJob?.jobId) {
			return;
		}

		void subscribeToJob(savedProductJob.jobId);
	}, [savedProductJob?.jobId, subscribeToJob]);

	useEffect(() => {
		if (!productId) {
			setProductError("Missing product id in route params");
			return;
		}

		const loadProduct = async () => {
			try {
				setIsProductLoading(true);
				setProductError(null);

				const response = await authFetch(`/api/products/${productId}`, {
					method: "GET",
				});

				const payload = (await response
					.json()
					.catch(() => ({}))) as ProductDetailsResponse;

				if (!response.ok) {
					throw new Error(payload.message || "Failed to load product details");
				}

				if (!payload.data) {
					throw new Error("Missing product details from response");
				}

				setProduct(payload.data);
			} catch (error) {
				setProductError(
					error instanceof Error
						? error.message
						: "Failed to load product details",
				);
			} finally {
				setIsProductLoading(false);
			}
		};

		void loadProduct();
	}, [productId]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!productId) {
			setSubmitError("Missing product id");
			return;
		}

		const trimmedPrompt = prompt.trim();
		if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
			setSubmitError("Prompt is too short. Add a bit more detail.");
			return;
		}

		try {
			setIsSubmitting(true);
			setSubmitError(null);

			const response = await authFetch(
				`/api/tryon/image/edit?productId=${encodeURIComponent(productId)}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ userPrompt: trimmedPrompt }),
				},
			);

			const payload = (await response
				.json()
				.catch(() => ({}))) as ImageEditResponse;

			if (!response.ok) {
				throw new Error(payload.message || "Failed to queue image edit job");
			}

			const parsedJob: ImageEditJobPayload = {
				status: typeof payload.status === "string" ? payload.status : "QUEUED",
				jobId: typeof payload.jobId === "string" ? payload.jobId : "",
				jobType:
					typeof payload.jobType === "string"
						? payload.jobType
						: typeof payload.JobType === "string"
							? payload.JobType
							: "IMAGE_EDIT",
			};

			if (!parsedJob.jobId) {
				throw new Error("Image edit job was queued, but no jobId was returned");
			}

			saveJob(productId, parsedJob);
			await subscribeToJob(parsedJob.jobId);
			setPrompt("");
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: "Failed to queue image edit job",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isProductLoading) {
		return <Loader />;
	}

	return (
		<main className='mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<header className='rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white sm:p-8'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Product Image Edit
				</p>
				<h1 className='mt-2 text-2xl font-bold'>Edit Product Appearance</h1>
				<p className='mt-2 text-sm text-slate-300'>
					Fetches product from route params and queues an AI edit job using your
					prompt.
				</p>
			</header>

			{productError ? (
				<section className='mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200'>
					{productError}
				</section>
			) : null}

			{product ? (
				<section className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]'>
					<article className='overflow-hidden rounded-2xl border border-primary/20 bg-white/5'>
						<div className='relative aspect-4/3 bg-black/30'>
							<Image
								src={product.defaultImageUrl}
								alt={product.title}
								fill
								sizes='(max-width: 1024px) 100vw, 50vw'
								className='h-full w-full object-cover'
							/>
						</div>
						<div className='flex flex-col gap-2 p-4'>
							<p className='text-sm font-semibold text-white'>
								{product.title}
							</p>
							<p className='text-xs text-slate-400'>
								{product.source || "Unknown source"}
							</p>
							<p className='text-xs text-slate-400'>
								{product.price || "Price unavailable"}
							</p>
						</div>
					</article>

					<article className='rounded-2xl border border-primary/20 bg-[#130c1d] p-5 text-white'>
						<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
							<label
								htmlFor='image-edit-prompt'
								className='text-sm font-semibold'
							>
								What should change in this product image?
							</label>
							<textarea
								id='image-edit-prompt'
								value={prompt}
								onChange={(event) => setPrompt(event.target.value)}
								placeholder='Example: change the dress color to green and add a bird logo in the hat'
								rows={6}
								className='min-h-32 w-full resize-y rounded-md border border-primary/30 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40'
							/>
							<p className='text-xs text-slate-400'>
								Minimum {MIN_PROMPT_LENGTH} characters.
							</p>

							<Button
								type='submit'
								disabled={
									isSubmitting || prompt.trim().length < MIN_PROMPT_LENGTH
								}
							>
								{isSubmitting ? "Queuing..." : "Queue Image Edit"}
							</Button>
						</form>

						{submitError ? (
							<p className='mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200'>
								{submitError}
							</p>
						) : null}

						{savedProductJob ? (
							<div className='mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100'>
								<p className='font-semibold'>
									Latest queued job saved to store
								</p>
								<p className='mt-1'>status: {savedProductJob.status}</p>
								<p>jobId: {savedProductJob.jobId}</p>
								<p>jobType: {savedProductJob.jobType}</p>
							</div>
						) : null}
					</article>
				</section>
			) : null}
		</main>
	);
}
