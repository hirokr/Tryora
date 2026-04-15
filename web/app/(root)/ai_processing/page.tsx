"use client";

import { useAiProcessingState } from "@/hooks/useAiProcessingState";

import { ProcessingStatusGrid } from "@/components/utility/ai/ProcessingStatusGrid";

import { ProcessingVisualizer } from "@/components/utility/ai/ProcessingVisualizer";

import { AiProcessingDecor } from "./_components/AiProcessingDecor";
import { AiProcessingHeading } from "./_components/AiProcessingHeading";

export default function AiProcessingPage() {
	const { neuralProgress, latencyMs, etaLabel } = useAiProcessingState();

	return (
		<div
			className="relative flex min-h-screen w-full flex-col overflow-x-hidden font-display text-slate-100"
			style={{ backgroundColor: "#191022" }}
		>
			<AiProcessingDecor />

			

			<main className="flex flex-1 flex-col items-center px-6 py-10 lg:px-40">
				<div className="w-full max-w-4xl">
					<AiProcessingHeading />

					<ProcessingVisualizer latencyMs={latencyMs} />
					<ProcessingStatusGrid neuralProgress={neuralProgress} />
					
				</div>
			</main>
		</div>
	);
}
