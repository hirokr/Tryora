const cards = [
	{
		icon: "public",
		title: "Universal Access",
		desc: "Your clothes follow you everywhere. Seamless integration with major gaming engines.",
	},
	{
		icon: "shield_lock",
		title: "Blockchain Secured",
		desc: "Ownership verified on the distributed ledger. True digital scarcity and proof of origin.",
	},
	{
		icon: "sync",
		title: "Cloud Syncing",
		desc: "Instantly update your style across all connected accounts and virtual spaces.",
	},
];

export default function WardrobeSection() {
	return (
		<section className='bg-accent-dark px-6 py-20 sm:py-24 lg:px-20 lg:py-32'>
			<div className='mx-auto max-w-7xl'>
				<div className='mb-12 text-center sm:mb-16' data-reveal>
					<h2 className='font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl'>
						Distributed Wardrobe
					</h2>
					<p className='mx-auto mt-4 max-w-2xl text-slate-400'>
						Access your digital collection across any platform, game, or
						metaverse instantly.
					</p>
				</div>
				<div className='grid gap-6 md:grid-cols-3 md:gap-8' data-stagger>
					{cards.map((card) => (
						<div
							key={card.title}
							className='glass-card flex flex-col gap-6 rounded-2xl p-8 transition-transform hover:-translate-y-2'
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
			</div>
		</section>
	);
}
