"use client";

import { useEffect, useMemo, useState } from "react";

type PublicShareProps = {
	tryonId: string;
	label?: string;
};

export function PublicShare({ tryonId, label = "Public share" }: PublicShareProps) {
	const sharePath = useMemo(() => `/public-share/${tryonId}`, [tryonId]);
	const [shareUrl, setShareUrl] = useState<string>("");
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

	useEffect(() => {
		setShareUrl(`${window.location.origin}${sharePath}`);
	}, [sharePath]);

	const linkToCopy = shareUrl || sharePath;

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(linkToCopy);
			setCopyStatus("copied");
			window.setTimeout(() => setCopyStatus("idle"), 1800);
		} catch {
			setCopyStatus("error");
			window.setTimeout(() => setCopyStatus("idle"), 2200);
		}
	};

	return (
		<div className='w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-5'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-xs uppercase tracking-[0.22em] text-cyan-100'>{label}</p>
					<h3 className='mt-1 text-lg font-semibold'>Share this try-on publicly</h3>
					<p className='mt-1 text-sm text-slate-300'>
						Copy a browser-safe link that anyone can open without signing in.
					</p>
				</div>

				<div className='flex flex-wrap gap-2'>
					<a
						href={sharePath}
						target='_blank'
						rel='noreferrer noopener'
						className='rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10'
					>
						Open public page
					</a>
					<button
						type='button'
						onClick={() => void handleCopyLink()}
						className='rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200'
					>
						{copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy link"}
					</button>
				</div>
			</div>

			<div className='mt-4 rounded-2xl border border-white/10 bg-black/20 p-3'>
				<p className='mb-2 text-xs uppercase tracking-[0.2em] text-slate-400'>Share URL</p>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
					<input
						readOnly
						value={linkToCopy}
						className='w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none'
					/>
					<span className='shrink-0 text-xs text-slate-400'>
						Use this link in messages, email, or social apps.
					</span>
				</div>
			</div>
		</div>
	);
}