import Link from "next/link";

const cards = [
	{
		icon: "integration_instructions",
		title: "Seamless Integration",
		desc: "One-click SDK for existing e-commerce platforms like Shopify, Magento, and custom builds.",
	},
	{
		icon: "monitoring",
		title: "Insightful Analytics",
		desc: "Track virtual engagement, try-on rates, and customer body data trends in real-time.",
	},
	{
		icon: "language",
		title: "Global Scalability",
		desc: "Deploy your digital collection across web, mobile, and the metaverse with a single asset pipeline.",
	},
];

export default function BrandsSection() {
	return (
		<section className='border-t border-primary/10 bg-background-dark px-6 py-20 sm:py-24 lg:px-20 lg:py-32'>
			<div className='mx-auto max-w-7xl'>
				<div className='mb-6 text-center sm:mb-16' data-reveal>
					<h2 className='mb-6 font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl'>
						Elevate Your Brand with Tryora
					</h2>
					<p className='mx-auto max-w-3xl text-lg text-slate-400 sm:text-xl'>
						Empower your customers with the future of digital retail. Reduce
						returns by up to 40% and increase engagement with hyper-realistic 3D
						experiences.
					</p>
				</div>
				<div className='mb-6 grid gap-2 md:grid-cols-3 md:gap-8' data-stagger>
					{cards.map((card) => (
						<div
							key={card.title}
							className='glass-card flex flex-col gap-6 rounded-xl p-8 transition-all hover:shadow-[0_0_30px_rgba(140,43,238,0.2)]'
						>
							<div className='text-primary'>
								<span
									className='material-symbols-outlined'
									style={{ fontSize: "2.25rem" }}
								>
									{card.icon}
								</span>
							</div>
							<h3 className='font-serif text-2xl font-bold text-white'>
								{card.title}
							</h3>
							<p className='text-slate-400'>{card.desc}</p>
						</div>
					))}
				</div>
				<div className='flex justify-center' data-reveal>
					<Link
						href='/signup'
						className='flex h-14 items-center rounded-xl bg-primary px-10 text-lg font-bold text-white shadow-[0_0_20px_rgba(140,43,238,0.3)] transition-transform hover:scale-105'
					>
						Partner With Us
					</Link>
				</div>
			</div>
		</section>
	);
}
