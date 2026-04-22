"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useTryonSocket } from "@/context/tryonSocket.context";
import { Button } from "@/components/ui/button";

const statusClassNameByType: Record<string, string> = {
	QUEUED: "bg-slate-500/20 text-slate-200 border-slate-300/20",
	PROCESSING: "bg-amber-500/20 text-amber-200 border-amber-300/30",
	COMPLETED: "bg-emerald-500/20 text-emerald-200 border-emerald-300/30",
	FAILED: "bg-red-500/20 text-red-200 border-red-300/30",
	CANCELLED: "bg-zinc-500/20 text-zinc-200 border-zinc-300/30",
};

const getStatusClassName = (status: string) => {
	return (
		statusClassNameByType[status] ||
		"bg-blue-500/20 text-blue-200 border-blue-300/30"
	);
};

export default function TryonJobStatusPanel() {
	const { trackedJobs, clearCompletedJobs } = useTryonSocket();
	const [isCollapsed, setIsCollapsed] = useState(() => {
		if (typeof window === "undefined") {
			return false;
		}

		const savedState = window.localStorage.getItem(
			"tryon-jobs-panel-collapsed",
		);
		if (savedState === "true" || savedState === "false") {
			return savedState === "true";
		}

		return window.matchMedia("(max-width: 768px)").matches;
	});

	const activeJobsCount = useMemo(
		() =>
			trackedJobs.filter(
				(job) => job.status !== "COMPLETED" && job.status !== "FAILED",
			).length,
		[trackedJobs],
	);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		window.localStorage.setItem(
			"tryon-jobs-panel-collapsed",
			String(isCollapsed),
		);
	}, [isCollapsed]);

	if (trackedJobs.length === 0) {
		return null;
	}

	return (
		<section className='fixed bottom-4 right-4 z-50 w-[min(92vw,420px)] rounded-xl border border-white/15 bg-[#100a18]/95 p-4 shadow-xl backdrop-blur'>
			<header className='flex items-center justify-between gap-3'>
				<div>
					<p className='text-sm font-semibold text-white'>Try-on job status</p>
					<p className='text-xs text-slate-300'>Live updates from websocket</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white'>
						{activeJobsCount} active
					</span>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() => setIsCollapsed((previous) => !previous)}
					>
						{isCollapsed ? "Expand" : "Minimize"}
					</Button>
				</div>
			</header>

			{isCollapsed ? null : (
				<>
					<div className='mt-3 flex justify-end'>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={clearCompletedJobs}
						>
							Clear done
						</Button>
					</div>
					<div className='mt-2 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1'>
						{trackedJobs.map((job) => {
							const shortJobId = job.jobId.slice(0, 8);

							return (
								<article
									key={job.jobId}
									className='rounded-lg border border-white/10 bg-black/25 p-3'
								>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<p className='text-xs text-slate-300'>Job {shortJobId}</p>
											<p className='text-[11px] uppercase tracking-wide text-slate-400'>
												{job.jobType}
											</p>
										</div>
										<span
											className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClassName(job.status)}`}
										>
											{job.status}
										</span>
									</div>

									{job.errorMessage ? (
										<p className='mt-2 text-xs text-red-200'>
											{job.errorMessage}
										</p>
									) : null}

									{job.tryonId ? (
										<Link
											href={`/tryon/${job.tryonId}`}
											className='mt-2 inline-flex text-xs font-semibold text-emerald-300 underline'
										>
											Open result
										</Link>
									) : null}
								</article>
							);
						})}
					</div>
				</>
			)}
		</section>
	);
}
