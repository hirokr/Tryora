import type { NotificationState } from "@/types/common";

interface AvatarStudioNotificationsProps {
	notification: NotificationState;
	onClear: () => void;
	onRetry: () => void;
}

export function AvatarStudioNotifications({
	notification,
	onClear,
	onRetry,
}: AvatarStudioNotificationsProps) {
	return (
		<>
			{notification === "progress" && (
				<div className='absolute bottom-24 right-8 z-50 w-80 rounded-xl border border-primary/30 bg-[#1f1328]/90 p-5 shadow-2xl backdrop-blur-xl'>
					<div className='mb-4 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<span className='material-symbols-outlined animate-pulse text-primary'>
								magic_button
							</span>
							<h3 className='text-sm font-bold tracking-wide text-slate-100'>
								VTON Rendering in Progress...
							</h3>
						</div>
						<button onClick={onClear}>
							<span className='material-symbols-outlined cursor-pointer text-xs text-slate-500 hover:text-white'>
								close
							</span>
						</button>
					</div>
					<div className='space-y-3'>
						<div className='mb-1 flex items-end justify-between'>
							<span className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
								Generating Mesh Updates
							</span>
							<span className='text-xs font-bold text-primary'>72%</span>
						</div>
						<div className='h-2 w-full overflow-hidden rounded-full border border-white/5 bg-white/5'>
							<div className='h-full w-[72%] bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_10px_rgba(140,43,238,0.5)] transition-all duration-700' />
						</div>
					</div>
					<div className='mt-6 flex items-center justify-between border-t border-white/5 pt-4'>
						<div className='flex items-center gap-2'>
							<span className='material-symbols-outlined text-sm text-primary'>
								auto_awesome
							</span>
							<p className='text-[9px] font-bold uppercase tracking-tighter text-primary'>
								Powered by Gemini
							</p>
						</div>
						<span className='text-[9px] font-medium uppercase text-slate-500'>
							Est. 4s remaining
						</span>
					</div>
				</div>
			)}

			{notification === "error" && (
				<div className='absolute bottom-24 right-8 z-50 w-80 rounded-xl border border-red-500/50 bg-[#1f1328]/90 p-5 shadow-[0_0_20px_rgba(239,68,68,0.2)] backdrop-blur-xl'>
					<div className='mb-4 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<span className='material-symbols-outlined text-red-500'>
								error
							</span>
							<h3 className='text-sm font-bold tracking-wide text-slate-100'>
								VTON Rendering Failed
							</h3>
						</div>
						<button onClick={onClear}>
							<span className='material-symbols-outlined cursor-pointer text-xs text-slate-500 hover:text-white'>
								close
							</span>
						</button>
					</div>
					<div className='space-y-4'>
						<p className='text-xs leading-relaxed text-slate-400'>
							Avatar preview could not be loaded. Please retry the render and
							try again.
						</p>
						<div className='flex flex-col gap-2 pt-2'>
							<button
								onClick={onRetry}
								className='w-full rounded-lg bg-primary py-2 text-xs font-bold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90'
							>
								Retry Render
							</button>
							<button
								onClick={onClear}
								className='w-full rounded-lg border border-white/10 bg-transparent py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-white/5'
							>
								Reset Avatar
							</button>
						</div>
					</div>
					<div className='mt-6 flex items-center justify-between border-t border-white/5 pt-4'>
						<div className='flex items-center gap-2'>
							<span className='material-symbols-outlined text-sm text-primary'>
								auto_awesome
							</span>
							<p className='text-[9px] font-bold uppercase tracking-tighter text-primary'>
								Powered by Gemini
							</p>
						</div>
					</div>
				</div>
			)}

			{notification === "success" && (
				<div className='absolute bottom-24 right-8 z-50 w-80 rounded-xl border border-emerald-500/40 bg-[#1f1328]/90 p-5 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-xl'>
					<div className='mb-3 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<span className='material-symbols-outlined text-emerald-400'>
								check_circle
							</span>
							<h3 className='text-sm font-bold tracking-wide text-slate-100'>
								VTON Rendering Success
							</h3>
						</div>
						<button onClick={onClear}>
							<span className='material-symbols-outlined cursor-pointer text-xs text-slate-500 hover:text-white'>
								close
							</span>
						</button>
					</div>
					<p className='text-xs leading-relaxed text-slate-300'>
						Avatar preview loaded successfully.
					</p>
				</div>
			)}
		</>
	);
}
