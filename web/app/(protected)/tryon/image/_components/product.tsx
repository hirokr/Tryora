"use client";

import Image from "next/image";

import type { SelectedProduct } from "@/store/useSelectedProductsStore";

type ProductPreviewProps = {
	product: SelectedProduct;
	isSelected: boolean;
	onToggleSelect: (product: SelectedProduct) => void;
};

export function ProductPreview({
	product,
	isSelected,
	onToggleSelect,
}: ProductPreviewProps) {
	return (
		<article className='mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-black/20 text-white gap-4 p-4 flex flex-col'>
			<div className='flex items-center gap-2'>
				<div className='relative w-full shrink-0 aspect-4/3 overflow-hidden rounded-md bg-black/40'>
					<Image
						src={product.imageUrl}
						alt={product.title}
						fill
						sizes='(max-width: 768px) 100vw, 384px'
						className='object-contain'
					/>
				</div>
			</div>
			<button
				type='button'
				onClick={() => onToggleSelect(product)}
				className='rounded-md border border-primary/40 px-2.5 py-1 text-sm font-semibold transition-colors hover:bg-primary/10 text-white'
			>
				{isSelected ? "Selected" : "Select"}
			</button>
		</article>
	);
}
