"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

type TryonPreview = {
	id: string;
	resultUrl?: string | null;
	tryonType?: string;
	createdAt?: string;
};

type TryonPreviewCardProps = {
	tryon: TryonPreview;
	isSelected: boolean;
	onSelect: (tryonId: string) => void;
	onGenerate: (tryonId: string) => void;
	isGenerating: boolean;
};

function formatType(value?: string) {
	if (!value) return "Try-on";

	return value
		.toLowerCase()
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatDate(value?: string) {
	if (!value) return "Unknown date";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Unknown date";

	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export function TryonPreviewCard({
	tryon,
	isSelected,
	onSelect,
	onGenerate,
	isGenerating,
}: TryonPreviewCardProps) {
	return (
		<article className='mx-auto flex w-full max-w-sm flex-col gap-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-4 text-white'>
			<button
				type='button'
				onClick={() => onSelect(tryon.id)}
				className={`relative aspect-4/3 w-full overflow-hidden rounded-md bg-black/40 ${
					isSelected ? "ring-2 ring-primary/70" : ""
				}`}
			>
				<Image
					src={tryon.resultUrl || ""}
					alt={`Try-on ${tryon.id}`}
					fill
					sizes='(max-width: 768px) 100vw, 384px'
					className='object-cover'
					unoptimized
				/>
			</button>

			<div className='space-y-1'>
				<p className='text-sm font-semibold text-white'>
					{formatType(tryon.tryonType)}
				</p>
				<p className='text-xs text-slate-400'>
					Created: {formatDate(tryon.createdAt)}
				</p>
			</div>

			{isSelected ? (
				<Button onClick={() => onGenerate(tryon.id)} disabled={isGenerating}>
					{isGenerating ? "Queuing..." : "Generate model"}
				</Button>
			) : null}
		</article>
	);
}
