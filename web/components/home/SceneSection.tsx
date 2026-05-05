export default function SceneSection() {
	return (
		<section className='overflow-hidden bg-background-dark px-6 py-20 sm:py-24 lg:px-20 lg:py-32'>
			<div className='mx-auto max-w-7xl'>
				<div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
					<div className='relative order-2 lg:order-1' data-parallax>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-4'>
								<div className='aspect-[4/5] overflow-hidden rounded-2xl border border-primary/20'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className='h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0'
										src='https://lh3.googleusercontent.com/aida-public/AB6AXuAhhOGrJBwil0veL1qyyIuiDLLYgXX1HGKGOdq2EJjhcaUlycP9TAv49Ncbsl2Pwi_LmG85lmrNbJGyZeK4IO7GnuUrMV-0BQde8H1SFZTdW-JDhi9C5R0gbnOY0HULm2v6imX49RYc-nwS0p1O3DI72gj865DZEsVoLRXgDCYHT--rxIGNmSubDlywLO2grnWvD9ZNzeRGCBnC8AqIO5_RrsHYijooEXd_vBt7AN0JC5EzOx6OdrcE5BWUg8gjk_HRuJZAqBeKDnIt'
										alt='Cyberpunk city street environment'
									/>
								</div>
								<div className='aspect-[4/5] translate-x-3 overflow-hidden rounded-2xl border border-primary/20 sm:translate-x-4'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className='h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0'
										src='https://lh3.googleusercontent.com/aida-public/AB6AXuBEN32Yct3QsxfpYzLoXUTjKSRNn-n1dGFqCuqmdhrlkCryhY70k065d9tzHwkPRsbTpWrdHVJGF1V1C3wuhhMfShGHkd0EcfFJxeaoyAMmIC-1EJz8DKo_31EbwpV5IwwZaOHirtaANR6RSTNKKz7nDo3yfITzItUPZPFOLkLebLH8IglrNueJrTQgDlE8oh0XU0gJ58BoKzXM1bC21dKURUTj0-LjoVN7Fqo2bZTWy1I6JWSrVOquE40zpGJVNcE819xBkHYfrxYQ'
										alt='High mountain landscape environment'
									/>
								</div>
							</div>
							<div className='space-y-4 pt-8 sm:pt-12'>
								<div className='aspect-[4/5] overflow-hidden rounded-2xl border border-primary/20'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className='h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0'
										src='https://lh3.googleusercontent.com/aida-public/AB6AXuAZHoNh0dNRvpZMsjipmGTLDeICjLz0zn5xp9NO2u4WnnPFKsF0gc4eTGa-YnfxIFTx6ar38jVHFX1qbF4hXlL14jpR0xvPxdGj017IbWv9BZDTzm9XoWTNcM6NXYWvhZHo_PXIEgEUGgyV1d8mpW5MTIEjSjuNnFPIcCMy0VzAb2Oh-VO0NeuXWgcvayiG6PxAYqC9BD5d-eyRtEitk4QuYFakLc-nhLGn96Z8AJeRDK0kgAMt620lwt-XtjmZZDPfjYXU8JR6f5tj'
										alt='Dense forest lighting environment'
									/>
								</div>
								<div className='aspect-[4/5] -translate-x-3 overflow-hidden rounded-2xl border border-primary/20 sm:-translate-x-4'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className='h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0'
										src='https://lh3.googleusercontent.com/aida-public/AB6AXuAUrTPkYMuoR4YhWx1o5ar8p8um6oyRMjazoasOHeolcMl3f-x_ee282REok1FuM1x5eRFdiQwU6F_wqZGSpUt128SUioK2rHtVecqNxaEO0IkcJP_qmb3551at70Q5rF3Jbn-NAdRbVoLfQVcIb3QbDmAhASOTqHO0DsuCCIBDtHZHJuffgQ0RDJ1NYx4WrVaY2z4wiAI-S5ExFQtAdqxgIItQotbYXV-Simc3D6f9uol3eYh-k9ifhO3OWNGTQksK5ccZRRGE1uWk'
										alt='Minimalist architectural environment'
									/>
								</div>
							</div>
						</div>
					</div>

					<div className='order-1 flex flex-col gap-8 lg:order-2' data-reveal>
						<h2 className='font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl'>
							AI Scene <br />
							<span className='text-primary italic'>Generation</span>
						</h2>
						<p className='text-lg leading-relaxed text-slate-400 sm:text-xl'>
							Transport your avatar to any environment with AI-generated
							cinematic backgrounds that react to your movements and clothing
							textures.
						</p>
						<div className='flex flex-col gap-6' data-stagger>
							<div className='flex gap-4'>
								<span className='material-symbols-outlined text-primary'>
									landscape
								</span>
								<div>
									<h4 className='font-bold text-white'>
										Infinite Environments
									</h4>
									<p className='text-slate-400'>
										From futuristic neo-Tokyo to serene natural landscapes.
									</p>
								</div>
							</div>
							<div className='flex gap-4'>
								<span className='material-symbols-outlined text-primary'>
									light_mode
								</span>
								<div>
									<h4 className='font-bold text-white'>Dynamic Lighting</h4>
									<p className='text-slate-400'>
										Ray-traced lighting that reacts to your 3D model in
										real-time.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
