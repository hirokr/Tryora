export default function TryOnSection() {
	return (
		<section
			id='features'
			className='bg-background-dark px-6 py-20 sm:py-24 lg:px-20 lg:py-32'
			data-reveal
		>
			<div className='mx-auto max-w-7xl'>
				<div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
					<div className='flex flex-col gap-8'>
						<h2 className='font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl'>
							AI-Driven <br />
							<span className='text-primary italic'>3D Try-On</span>
						</h2>
						<p className='text-lg leading-relaxed text-slate-400 sm:text-xl'>
							Immerse yourself in a high-fidelity virtual fitting room where
							garments drape perfectly on your digital twin with sub-millimeter
							accuracy.
						</p>
						<div className='grid gap-6' data-stagger>
							<div className='flex items-start gap-4'>
								<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary'>
									<span className='material-symbols-outlined'>straighten</span>
								</div>
								<div>
									<h4 className='font-bold text-white'>Precision Mapping</h4>
									<p className='text-slate-400'>
										Sub-millimeter accuracy for every unique body type.
									</p>
								</div>
							</div>
							<div className='flex items-start gap-4'>
								<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary'>
									<span className='material-symbols-outlined'>waves</span>
								</div>
								<div>
									<h4 className='font-bold text-white'>Real-time Physics</h4>
									<p className='text-slate-400'>
										Fabric simulation powered by advanced AI vertex prediction.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className='relative group' data-parallax>
						<div className='absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl transition-all group-hover:bg-primary/30'></div>
						<div className='relative aspect-square overflow-hidden rounded-2xl border border-primary/20 bg-accent-dark'>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								className='h-full w-full object-cover opacity-80'
								src='https://lh3.googleusercontent.com/aida-public/AB6AXuDmURjFEXGYG0cY40fiMGYz1rGBQ970CxlrCw7n2aNVKz2ipqaOiLC3gm7ux6hP9C2qM9AODYiZrCnhAAtapQkofCJSxcKrpR8ckEWRJwHbN3gpGCJG4ABagTR6zF970tmFc3ebFhURzNtLX5wJdTjvyUdVZ49mmvdYOFgKsNLedL-SUKhle5dUux4ZVWuzKIBk3M5ACsMjK2ovYtL2nGkObAaF2_FzRi8BCghyA_qPnky5akp1Ef63c688cQxNU4evRP81eDwlEvij'
								alt='Digital mannequin being scanned by laser lights'
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
