import Link from "next/link";

export default function FinalCtaSection() {
	return (
		<section className='relative bg-background-dark py-20 sm:py-24 lg:py-40'>
			<div
				className='absolute inset-0 opacity-20'
				style={{
					backgroundImage: "radial-gradient(#8c2bee 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			></div>
			<div
				className='relative z-10 mx-auto max-w-4xl px-6 text-center'
				data-reveal
			>
				<h2 className='mb-6 font-serif text-3xl font-bold text-white sm:text-4xl md:text-6xl'>
					Ready to step into the <span className='text-primary'>Future</span>?
				</h2>
				<p className='mb-10 text-lg italic text-slate-300 sm:text-xl'>
					Join thousands of creators defining the next generation of style.
				</p>
				<div className='flex flex-wrap justify-center gap-6'>
					<Link
						href='/signup'
						className='flex h-16 items-center rounded-2xl bg-primary px-10 text-lg font-bold text-white shadow-[0_0_40px_rgba(140,43,238,0.3)] transition-transform hover:scale-105 sm:text-xl'
					>
						Create Your Avatar
					</Link>
				</div>
			</div>
		</section>
	);
}
