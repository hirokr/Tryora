import Link from "next/link";

export default function AvatarStudioLandingPage() {
	return (
		<main className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<section className='overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(24,18,38,0.96),rgba(13,10,25,0.96))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8'>
				<div className='max-w-3xl space-y-4'>
					<p className='text-xs uppercase tracking-[0.2em] text-cyan-100'>
						Avatar Studio
					</p>
					<h1 className='font-serif text-3xl sm:text-4xl'>Open a generated 3D model</h1>
					<p className='text-sm leading-6 text-slate-300 sm:text-base'>
						This route expects a try-on job id in the URL. When a model job
						finishes, the studio opens the matching dynamic page and renders the
						returned 3D model with React Three Fiber.
					</p>
				</div>

				<div className='mt-8 flex flex-wrap gap-3'>
					<Link
						href='/tryon/model'
						className='rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10'
					>
						Back to model jobs
					</Link>
					<Link
						href='/tryon'
						className='rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200'
					>
						Try-on history
					</Link>
				</div>
			</section>
		</main>
	);
}