"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OUTFIT_COMPARISON_SELECTION_STORAGE_KEY } from "@/constants/flow";
import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";

import { ComparisonActions } from "./_components/ComparisonActions";
import { ComparisonImagePanel } from "./_components/ComparisonImagePanel";
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

	const leftImageUrl =
		selection?.outfitA?.imageUrl || fallbackOutfitA?.imageUrl || null;
	const rightImageUrl =
		selection?.outfitB?.imageUrl || fallbackOutfitB?.imageUrl || null;
	const isUsingFallbackProducts =
		!selection?.outfitA?.imageUrl &&
		!selection?.outfitB?.imageUrl &&
		Boolean(fallbackOutfitA && fallbackOutfitB);

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
				</div>

				<div className='flex flex-1 flex-col overflow-hidden lg:flex-row'>
					<ComparisonImagePanel
						title='Outfit A'
						imageUrl={leftImageUrl}
						emptyHint='Outfit A is empty. Upload a photo or select products from discovery first.'
					/>

					<ComparisonImagePanel
						title='Outfit B'
						imageUrl={rightImageUrl}
						emptyHint='Outfit B is empty. Upload a photo or select products from discovery first.'
						mirrored
					/>
				</div>

				<ComparisonActions
					canSnapshot={Boolean(leftImageUrl && rightImageUrl)}
					onUploadPhoto={handleUploadPhoto}
					onSnapshot={handleSnapshot}
				/>

				{snapshotError ? (
					<p className='px-6 pb-4 text-sm text-red-300'>{snapshotError}</p>
				) : null}
			</main>
		</div>
	);
}
