import { PROCESSING_GEOMETRY_BARS } from "@/constants/ai";

interface ProcessingStatusGridProps {
	neuralProgress: number;
}

export const ProcessingStatusGrid = ({ neuralProgress }: ProcessingStatusGridProps) => {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-white/5 p-6 backdrop-blur-md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="material-symbols-outlined text-primary">psychology</span>
						<span className="text-sm font-bold">Neural Mapping</span>
					</div>
					<span className="text-sm font-bold text-primary">{neuralProgress}%</span>
				</div>
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
					<div className="h-full bg-primary" style={{ width: `${neuralProgress}%` }} />
				</div>
				<p className="text-[10px] font-bold uppercase tracking-widest text-primary/50">
					Processing vertices...
				</p>
			</div>

			<div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-white/5 p-6 backdrop-blur-md">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-primary/20 p-2">
						<span className="material-symbols-outlined text-primary">view_in_ar</span>
					</div>
					<div>
						<h3 className="text-sm font-bold">Mesh Geometry</h3>
						<span className="flex items-center gap-1 text-xs text-green-400">
							<span className="size-1.5 rounded-full bg-green-400" />
							Active
						</span>
					</div>
				</div>
				<div className="mt-auto flex items-end gap-1">
					{PROCESSING_GEOMETRY_BARS.map((bar, index) => (
						<div key={index} className={`w-1 bg-primary ${bar.heightClass} ${bar.opacityClass}`} />
					))}
				</div>
			</div>

			<div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-white/5 p-6 opacity-70 backdrop-blur-md">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-slate-500/20 p-2">
						<span className="material-symbols-outlined text-slate-500">texture</span>
					</div>
					<div>
						<h3 className="text-sm font-bold">Texture Synthesis</h3>
						<span className="text-xs text-slate-400">Pending</span>
					</div>
				</div>
				<div className="mt-auto">
					<p className="text-xs text-slate-500">Awaiting geometry completion...</p>
				</div>
			</div>
		</div>
	);
};
