import { AI_RESULT_AVATAR_IMAGE } from "@/constants/ai";

export const ResultAvatarPanel = () => {
	return (
		<div className="relative mx-auto mb-12 w-full max-w-md aspect-[4/5] md:aspect-square">
			<div className="absolute inset-0 rounded-full bg-primary/20 opacity-50 blur-[100px]" />
			<div className="relative h-full w-full overflow-hidden rounded-3xl border border-primary/30 bg-slate-900/50 shadow-2xl">
				<div
					className="pointer-events-none absolute inset-0 opacity-30"
					style={{
						background:
							"linear-gradient(to bottom, transparent 50%, rgba(140,43,238,0.1) 51%, transparent 52%)",
						backgroundSize: "100% 4px",
					}}
				/>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					alt="3D Avatar Reconstruction"
					src={AI_RESULT_AVATAR_IMAGE}
					className="h-full w-full object-cover"
				/>
				<div className="absolute top-6 right-6 flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-4 py-2 backdrop-blur-md">
					<span className="material-symbols-outlined text-sm text-green-400">verified</span>
					<span className="text-xs font-bold uppercase tracking-wider text-green-400">
						Sync Complete
					</span>
				</div>
			</div>
		</div>
	);
};
