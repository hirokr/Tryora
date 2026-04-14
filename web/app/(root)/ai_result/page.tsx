import { ResultActions } from "@/components/utility/ai/ResultActions";
import { ResultAvatarPanel } from "@/components/utility/ai/ResultAvatarPanel";

import { ResultMetricsCard } from "@/components/utility/ai/ResultMetricsCard";

export default function AiSyncResultPage() {
	return (
		<div
			className="relative min-h-screen overflow-x-hidden font-display text-slate-100"
			style={{ backgroundColor: "#191022" }}
		>
			<div
				className="pointer-events-none fixed inset-0"
				style={{
					background:
						"radial-gradient(circle at 20% 30%, rgba(140,43,238,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(140,43,238,0.1) 0%, transparent 40%)",
				}}
			/>

			<div className="relative flex min-h-screen w-full flex-col">
				{/* <ResultHeader /> */}

				<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12">
					<ResultAvatarPanel />

					<div className="mb-10 text-center">
						<h1 className="mb-4 font-serif text-4xl leading-tight md:text-5xl">
							Digital Twin Synchronized
						</h1>
						<p className="mx-auto max-w-lg text-lg text-primary/70">
							Your high-fidelity neural reconstruction is complete and ready for deployment.
						</p>
					</div>

					<ResultMetricsCard />
					<ResultActions />
				</main>

				
			</div>
		</div>
	);
}
