import Link from "next/link";

export default function HeroSection() {
	return (
		<section
			className='relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden pt-16 sm:min-h-screen sm:pt-20'
			data-hero
		>
			<div className='absolute inset-0 z-0' data-hero-image>
				<div className='absolute inset-0 z-10 hero-gradient bg-background-dark/40'></div>
				<div className='flex h-full w-full items-center justify-center bg-slate-900'>
					<div
						className='absolute inset-0'
						style={{
							backgroundImage:
								"radial-gradient(circle at 50% 50%, #3a1a5e 0%, #0a070d 70%)",
							opacity: 0.5,
						}}
					></div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						className='absolute inset-0 h-full w-full object-cover opacity-60'
						src='https://lh3.googleusercontent.com/aida-public/AB6AXuBSw4BjkZYfEJz2DwEVEnVh--hR-9B0GcBNUgtFs90UkvSJkw_GkEohNkIR6uYXop50_tOVtjlNTaCZguCA5ZgQSCp8aHULNyVRYVZDkbduoSmL5oCFs1YtEjS2uHBXJ4s2Uzy4jXIGX0MLaEHhkxAyEIHZSaDN1GqXZp2GoXdQ12jWA3g2q5NiZ5kuCxeq0ylbyOvGnPeWmf-ZwTfBpILES1TmkGe4zste1q49q7QR1Srl60ggNfipJMNLIDzc7tsZU5bdjXxECERr'
						alt='Futuristic digital character with neon accents'
					/>
				</div>
			</div>

			<div className='relative z-20 flex flex-col items-center gap-8 px-6 text-center'>
				<h1
					className='font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl lg:max-w-4xl'
					data-hero-title
				>
					Experience the <span className='text-primary'>Future</span> of Fashion
				</h1>
				<p
					className='max-w-2xl text-base text-slate-300 sm:text-lg md:text-xl'
					data-hero-subtitle
				>
					AI-driven 3D reconstruction and cinematic try-on experiences. Your
					digital identity, perfectly draped.
				</p>
				<div className='flex flex-col gap-4 sm:flex-row' data-hero-actions>
					<Link
						href='/signup'
						className='flex h-14 min-w-[200px] items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-white transition-all hover:scale-105'
					>
						Launch Studio
					</Link>
					<a
						href='#features'
						className='flex h-14 min-w-[200px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/10'
					>
						View Showcase
					</a>
				</div>
			</div>

			<div
				className='absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-50'
				data-hero-badge
			>
				<span className='material-symbols-outlined text-white'>
					keyboard_double_arrow_down
				</span>
			</div>
		</section>
	);
}
