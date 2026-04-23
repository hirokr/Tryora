"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactCompareImage from "react-compare-image";

import { OUTFIT_COMPARISON_SELECTION_STORAGE_KEY } from "@/constants/flow";
import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";

import { ComparisonActions } from "./_components/ComparisonActions";
import type { OutfitSelectionPayload } from "./_components/types";

async function loadBitmap(url: string): Promise<ImageBitmap> {
	const response = await fetch(url, {
		method: "GET",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Failed to load image (${response.status})`);
	}

	const blob = await response.blob();
	return createImageBitmap(blob);
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
	const link = document.createElement("a");
	link.href = canvas.toDataURL("image/png");
	link.download = fileName;
	link.click();
}

export default function OutfitComparisonPage() {
	const router = useRouter();
	const selectedProducts = useSelectedProductsStore(
		(state) => state.selectedProducts,
	);

	const [selection, setSelection] = useState<OutfitSelectionPayload | null>(
		null,
	);
	const [leftImageUrl, setLeftImageUrl] = useState<string | null>(null);
	const [rightImageUrl, setRightImageUrl] = useState<string | null>(null);
	const [pickerTarget, setPickerTarget] = useState<"left" | "right" | null>(
		null,
	);
	const [snapshotError, setSnapshotError] = useState<string | null>(null);

	useEffect(() => {
		const raw = localStorage.getItem(OUTFIT_COMPARISON_SELECTION_STORAGE_KEY);
		if (!raw) {
			setSelection(null);
			return;
		}

		try {
			const parsed = JSON.parse(raw) as OutfitSelectionPayload;
			if (parsed?.outfitA?.imageUrl && parsed?.outfitB?.imageUrl) {
				setSelection(parsed);
				return;
			}
		} catch {
			// Ignore malformed stale payloads and clear them.
		}

		localStorage.removeItem(OUTFIT_COMPARISON_SELECTION_STORAGE_KEY);
		setSelection(null);
	}, []);

	const selectedAtLabel = useMemo(() => {
		if (!selection?.selectedAt) return null;
		return new Date(selection.selectedAt).toLocaleString();
	}, [selection?.selectedAt]);

	const fallbackOutfitA = selectedProducts[0] ?? null;
	const fallbackOutfitB = selectedProducts[1] ?? null;

	const defaultLeftImageUrl =
		selection?.outfitA?.imageUrl || fallbackOutfitA?.imageUrl || null;
	const defaultRightImageUrl =
		selection?.outfitB?.imageUrl || fallbackOutfitB?.imageUrl || null;

	useEffect(() => {
		if (!leftImageUrl && defaultLeftImageUrl) {
			setLeftImageUrl(defaultLeftImageUrl);
		}
	}, [defaultLeftImageUrl, leftImageUrl]);

	useEffect(() => {
		if (!rightImageUrl && defaultRightImageUrl) {
			setRightImageUrl(defaultRightImageUrl);
		}
	}, [defaultRightImageUrl, rightImageUrl]);

	const isUsingFallbackProducts =
		!selection?.outfitA?.imageUrl &&
		!selection?.outfitB?.imageUrl &&
		Boolean(fallbackOutfitA && fallbackOutfitB);
	const canCompare = Boolean(leftImageUrl && rightImageUrl);

	const handleChangeImage = (target: "left" | "right") => {
		setPickerTarget(target);
	};

	const handleSelectProductImage = (imageUrl: string) => {
		if (!pickerTarget) return;

		if (pickerTarget === "left") {
			setLeftImageUrl(imageUrl);
		} else {
			setRightImageUrl(imageUrl);
		}

		setPickerTarget(null);
	};

	const handleUploadPhoto = () => {
		router.push("/dashboard?section=me-and-myself&source=outfit-comparison");
	};

	const handleSnapshot = async () => {
		if (!leftImageUrl || !rightImageUrl) return;
		setSnapshotError(null);

		try {
			const [left, right] = await Promise.all([
				loadBitmap(leftImageUrl),
				loadBitmap(rightImageUrl),
			]);

			const targetHeight = 1200;
			const gap = 24;

			const leftWidth = Math.round((left.width / left.height) * targetHeight);
			const rightWidth = Math.round(
				(right.width / right.height) * targetHeight,
			);

			const canvas = document.createElement("canvas");
			canvas.width = leftWidth + rightWidth + gap;
			canvas.height = targetHeight;

			const context = canvas.getContext("2d");
			if (!context) {
				throw new Error("Canvas is unavailable.");
			}

			context.fillStyle = "#0e0a18";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(left, 0, 0, leftWidth, targetHeight);
			context.drawImage(right, leftWidth + gap, 0, rightWidth, targetHeight);

			downloadCanvas(canvas, "outfit-comparison-snapshot.png");
		} catch {
			setSnapshotError(
				"Failed to generate snapshot. Please try with different images.",
			);
		}
	};

	return (
		<div
			className='flex min-h-screen w-full overflow-hidden pt-20 font-display text-slate-100'
			style={{ backgroundColor: "#191022" }}
		>
			<main className='relative flex min-w-0 flex-1 flex-col overflow-hidden'>
				<div className='flex flex-wrap items-center justify-between gap-3 p-6'>
					<div>
						<h1 className='text-lg font-bold text-white'>Outfit Comparison</h1>
						<p className='mt-1 text-xs text-slate-400'>
							{selectedAtLabel
								? `Selected from Me & Myself on ${selectedAtLabel}`
								: "Choose two photos from Dashboard -> Me & Myself or select two products from discovery."}
						</p>
						{isUsingFallbackProducts ? (
							<p className='mt-1 text-xs text-emerald-300'>
								Comparing selected products from your saved try-on selection.
							</p>
						) : null}
					</div>
					<div className='flex flex-wrap gap-2'>
						<button
							type='button'
							onClick={() => handleChangeImage("left")}
							className='rounded-lg border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-200 hover:bg-white/5'
						>
							Change Outfit A Image
						</button>
						<button
							type='button'
							onClick={() => handleChangeImage("right")}
							className='rounded-lg border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-200 hover:bg-white/5'
						>
							Change Outfit B Image
						</button>
					</div>
				</div>

				<div className='flex flex-1 items-center justify-center overflow-hidden p-6'>
					{canCompare ? (
						<div className='w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/20'>
							<ReactCompareImage
								leftImage={leftImageUrl as string}
								rightImage={rightImageUrl as string}
								sliderLineColor='#ffffff'
								handleSize={48}
								hover
							/>
						</div>
					) : (
						<p className='max-w-lg text-center text-sm text-slate-300'>
							Select two images to compare. Use Change Outfit A Image and Change
							Outfit B Image to pick from your selected products.
						</p>
					)}
				</div>

				<ComparisonActions
					canSnapshot={canCompare}
					onUploadPhoto={handleUploadPhoto}
					onSnapshot={handleSnapshot}
				/>

				{snapshotError ? (
					<p className='px-6 pb-4 text-sm text-red-300'>{snapshotError}</p>
				) : null}

				{pickerTarget ? (
					<div className='absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4'>
						<div className='w-full max-w-2xl rounded-xl border border-white/10 bg-[#1f132b] p-4'>
							<div className='mb-4 flex items-center justify-between gap-3'>
								<h2 className='text-sm font-semibold uppercase tracking-wide text-white'>
									Select image for{" "}
									{pickerTarget === "left" ? "Outfit A" : "Outfit B"}
								</h2>
								<button
									type='button'
									onClick={() => setPickerTarget(null)}
									className='rounded-md border border-white/20 px-3 py-1 text-xs text-slate-200'
								>
									Close
								</button>
							</div>

							{selectedProducts.length ? (
								<div className='grid max-h-[60vh] grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3'>
									{selectedProducts.map((product) => (
										<button
											key={`${pickerTarget}-${product.id}`}
											type='button'
											onClick={() => handleSelectProductImage(product.imageUrl)}
											className='group overflow-hidden rounded-lg border border-white/15 text-left'
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={product.imageUrl}
												alt={product.title}
												className='h-28 w-full object-cover transition group-hover:scale-105'
											/>
											<p className='truncate px-2 py-1 text-xs text-slate-100'>
												{product.title}
											</p>
										</button>
									))}
								</div>
							) : (
								<p className='text-sm text-slate-300'>
									No selected products found in your store yet. Select products
									first, then return here to change either comparison image.
								</p>
							)}
						</div>
					</div>
				) : null}
			</main>
		</div>
	);
}
