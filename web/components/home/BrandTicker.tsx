type BrandTickerProps = {
	brands: string[];
};

export default function BrandTicker({ brands }: BrandTickerProps) {
	return (
		<section
			className='overflow-hidden border-y border-primary/10 bg-background-dark py-10 sm:py-12'
			data-reveal
		>
			<div className='container mx-auto mb-6 px-6 text-center'>
				<p className='text-xs font-bold uppercase tracking-[0.3em] text-slate-500'>
					Trusted by Global Fashion Leaders
				</p>
			</div>
			<div className='relative flex overflow-x-hidden'>
				<div className='animate-scroll flex items-center gap-12 px-4 sm:gap-16 md:gap-24'>
					<div className='flex items-center gap-12 sm:gap-16 md:gap-24'>
						{brands.map((brand) => (
							<span
								key={`a-${brand}`}
								className='cursor-default font-serif text-xl font-bold text-slate-600 grayscale transition-all hover:grayscale-0 hover:text-primary sm:text-2xl md:text-3xl'
							>
								{brand}
							</span>
						))}
					</div>
					<div className='flex items-center gap-12 sm:gap-16 md:gap-24'>
						{brands.map((brand) => (
							<span
								key={`b-${brand}`}
								className='cursor-default font-serif text-xl font-bold text-slate-600 grayscale transition-all hover:grayscale-0 hover:text-primary sm:text-2xl md:text-3xl'
							>
								{brand}
							</span>
						))}
					</div>
				</div>
				<div className='pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background-dark to-transparent sm:w-32'></div>
				<div className='pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background-dark to-transparent sm:w-32'></div>
			</div>
		</section>
	);
}
