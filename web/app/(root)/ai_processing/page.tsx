"use client";

import { useAiProcessingState } from "@/hooks/useAiProcessingState";

import { ProcessingStatusGrid } from "@/components/utility/ai/ProcessingStatusGrid";

import { ProcessingVisualizer } from "@/components/utility/ai/ProcessingVisualizer";

export default function AiProcessingPage() {
	const { neuralProgress, latencyMs, etaLabel } = useAiProcessingState();

	return (
		<div
			className="relative flex min-h-screen w-full flex-col overflow-x-hidden font-display text-slate-100"
			style={{ backgroundColor: "#191022" }}
		>
			<div className="pointer-events-none fixed top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
			<div className="pointer-events-none fixed bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

			

			<main className="flex flex-1 flex-col items-center px-6 py-10 lg:px-40">
				<div className="w-full max-w-4xl">
					<div className="mb-12 text-center">
						<h1 className="mb-4 font-serif text-4xl text-white md:text-6xl">
							Reconstructing Your Digital Twin
						</h1>
						<p className="text-lg font-medium text-primary/70">
							High-fidelity 3D synthesis in progress
						</p>
					</div>

					<ProcessingVisualizer latencyMs={latencyMs} />
					<ProcessingStatusGrid neuralProgress={neuralProgress} />
					
				</div>
			</main>
		</div>
	);
}
