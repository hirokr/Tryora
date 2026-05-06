"use client";

import { useMemo, useState } from "react";
import ReactCompareImage from "react-compare-image";

import { OUTFIT_COMPARISON_SELECTION_STORAGE_KEY } from "@/constants/flow";
import { useSelectedProductsStore } from "@/store/useSelectedProductsStore";

import type { OutfitSelectionPayload } from "./_components/types";
import type { SelectedProduct } from "@/store/useSelectedProductsStore";

type PickerTarget = "left" | "right";

const formatSelectedAt = (value?: string) => {
	if (!value) return null;
	return new Date(value).toLocaleString();
};

type HeaderSectionProps = {
	selectedAtLabel: string | null;
	isUsingFallbackProducts: boolean;
	onChangeLeft: () => void;
	onChangeRight: () => void;
};

const HeaderSection = ({
	selectedAtLabel,
	isUsingFallbackProducts,
	onChangeLeft,
	onChangeRight,
}: HeaderSectionProps) => (
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
				onClick={onChangeLeft}
				className='rounded-lg border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-200 hover:bg-white/5'
			>
				Change Outfit A Image
			</button>
			<button
				type='button'
				onClick={onChangeRight}
				className='rounded-lg border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-200 hover:bg-white/5'
			>
				Change Outfit B Image
			</button>
		</div>
	</div>
);

type ComparePanelProps = {
	canCompare: boolean;
	leftImageUrl: string | null;
	rightImageUrl: string | null;
};

const ComparePanel = ({
	canCompare,
	leftImageUrl,
	rightImageUrl,
}: ComparePanelProps) => (
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
);

type ProductPickerProps = {
	activeTarget: PickerTarget;
	products: SelectedProduct[];
	onSelect: (imageUrl: string) => void;
	onClose: () => void;
};

const ProductPicker = ({
	activeTarget,
	products,
	onSelect,
	onClose,
}: ProductPickerProps) => (
	<div
		className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-6 backdrop-blur-sm'
		onClick={onClose}
		role='dialog'
		aria-modal='true'
	>
		<section
			className='w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#120a1b] p-4 shadow-2xl'
			onClick={(event) => event.stopPropagation()}
		>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-xs font-semibold uppercase tracking-widest text-slate-300'>
						Pick an image for Outfit {activeTarget === "left" ? "A" : "B"}
					</p>
					<p className='mt-1 text-xs text-slate-400'>
						Choose from your selected products below.
					</p>
				</div>
				<button
					type='button'
					onClick={onClose}
					className='rounded-lg border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200 hover:bg-white/5'
				>
					Cancel
				</button>
			</div>
			{products.length ? (
				<div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
					{products.map((product) => (
						<button
							key={product.id}
							type='button'
							onClick={() => onSelect(product.imageUrl)}
							className='group overflow-hidden rounded-xl border border-white/10 bg-black/30 text-left transition hover:border-white/30'
						>
							<div className='aspect-3/4 w-full overflow-hidden bg-black/40'>
								<img
									src={product.imageUrl}
									alt={product.title}
									className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
								/>
							</div>
							<div className='px-3 py-2'>
								<p className='text-xs font-semibold text-slate-200 line-clamp-2'>
									{product.title}
								</p>
							</div>
						</button>
					))}
				</div>
			) : (
				<p className='mt-4 text-sm text-slate-400'>
					No selected products found. Add products from discovery first.
				</p>
			)}
		</section>
	</div>
);

export default function OutfitComparisonPage() {
	const selectedProducts = useSelectedProductsStore(
		(state) => state.selectedProducts,
	);

	const [selection] = useState<OutfitSelectionPayload | null>(() => {
		const raw = localStorage.getItem(OUTFIT_COMPARISON_SELECTION_STORAGE_KEY);
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as OutfitSelectionPayload;
			if (parsed?.outfitA?.imageUrl && parsed?.outfitB?.imageUrl) {
				return parsed;
			}
		} catch {
			// Ignore malformed stale payloads and clear them.
		}

		localStorage.removeItem(OUTFIT_COMPARISON_SELECTION_STORAGE_KEY);
		return null;
	});
	const [leftImageOverride, setLeftImageOverride] = useState<string | null>(
		null,
	);
	const [rightImageOverride, setRightImageOverride] = useState<string | null>(
		null,
	);
	const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

	const selectedAtLabel = useMemo(
		() => formatSelectedAt(selection?.selectedAt),
		[selection?.selectedAt],
	);

	const fallbackOutfitA = selectedProducts[0] ?? null;
	const fallbackOutfitB = selectedProducts[1] ?? null;

	const defaultLeftImageUrl =
		selection?.outfitA?.imageUrl || fallbackOutfitA?.imageUrl || null;
	const defaultRightImageUrl =
		selection?.outfitB?.imageUrl || fallbackOutfitB?.imageUrl || null;

	const leftImageUrl = leftImageOverride ?? defaultLeftImageUrl;
	const rightImageUrl = rightImageOverride ?? defaultRightImageUrl;

	const isUsingFallbackProducts =
		!selection?.outfitA?.imageUrl &&
		!selection?.outfitB?.imageUrl &&
		Boolean(fallbackOutfitA && fallbackOutfitB);
	const canCompare = Boolean(leftImageUrl && rightImageUrl);

	const handleChangeImage = (target: PickerTarget) => {
		setPickerTarget(target);
	};

	const handleSelectProductImage = (imageUrl: string) => {
		if (!pickerTarget) return;

		if (pickerTarget === "left") {
			setLeftImageOverride(imageUrl);
		} else {
			setRightImageOverride(imageUrl);
		}

		setPickerTarget(null);
	};

	return (
		<div
			className='flex min-h-screen w-full overflow-hidden pt-20 font-display text-slate-100'
			style={{ backgroundColor: "#191022" }}
		>
			<main className='relative flex min-w-0 flex-1 flex-col overflow-hidden'>
				<HeaderSection
					selectedAtLabel={selectedAtLabel}
					isUsingFallbackProducts={isUsingFallbackProducts}
					onChangeLeft={() => handleChangeImage("left")}
					onChangeRight={() => handleChangeImage("right")}
				/>
				{pickerTarget ? (
					<ProductPicker
						activeTarget={pickerTarget}
						products={selectedProducts}
						onSelect={handleSelectProductImage}
						onClose={() => setPickerTarget(null)}
					/>
				) : null}
				<ComparePanel
					canCompare={canCompare}
					leftImageUrl={leftImageUrl}
					rightImageUrl={rightImageUrl}
				/>
			</main>
		</div>
	);
}
