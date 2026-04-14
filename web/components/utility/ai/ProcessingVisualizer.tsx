interface ProcessingVisualizerProps {
	latencyMs: number;
}

export const ProcessingVisualizer = ({ latencyMs }: ProcessingVisualizerProps) => {
	return (
		<div className="relative mb-12 flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/5 to-transparent md:aspect-video">
			<div
				className="absolute inset-0 opacity-10"
				style={{
					backgroundImage: "radial-gradient(circle at 2px 2px, #8c2bee 1px, transparent 0)",
					backgroundSize: "24px 24px",
				}}
			/>

			<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
				<div
					className="absolute z-10 h-1 w-full bg-primary"
					style={{ boxShadow: "0 0 20px 2px rgba(140,43,238,0.8)", top: "25%" }}
				/>

				<div className="relative h-80 w-64 opacity-40">
					<div className="absolute inset-0 rounded-full border-2 border-primary/40 blur-sm" />
					<div className="absolute inset-x-8 inset-y-4 rounded-full border border-primary/30" />
					<div className="absolute inset-16 rounded-full border border-primary/20" />
					<div className="absolute top-1/2 left-1/2 h-64 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
				</div>

				<div className="absolute top-8 left-8">
					<div className="flex items-center gap-2 font-mono text-xs text-primary">
						<span className="material-symbols-outlined text-sm">grid_view</span>
						VERTEX_MAP_V02
					</div>
				</div>
				<div className="absolute right-8 bottom-8">
					<div className="font-mono text-xs text-primary">
						LATENCY: {latencyMs}ms
						<br />
						SYNC: STABLE
					</div>
				</div>
			</div>

			<div className="z-20 flex flex-col items-center">
				<span className="material-symbols-outlined animate-pulse text-7xl text-primary">
					android_fingerprint
				</span>
			</div>
		</div>
	);
};
