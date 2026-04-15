import { ResultActions } from "@/components/utility/ai/ResultActions";
import { ResultAvatarPanel } from "@/components/utility/ai/ResultAvatarPanel";

import { ResultMetricsCard } from "@/components/utility/ai/ResultMetricsCard";

import { AiResultBackground } from "./_components/AiResultBackground";
import { AiResultHeading } from "./_components/AiResultHeading";

export default function AiSyncResultPage() {
	return (
		<div
			className="relative min-h-screen overflow-x-hidden font-display text-slate-100"
			style={{ backgroundColor: "#191022" }}
		>
			<AiResultBackground />

			<div className="relative flex min-h-screen w-full flex-col">
				{/* <ResultHeader /> */}

				<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12">
					<ResultAvatarPanel />
					<AiResultHeading />

					<ResultMetricsCard />
					<ResultActions />
				</main>

				
			</div>
		</div>
	);
}
