import {
	ArrowRight,
	Box,
	CalendarDays,
	Camera,
	ChevronsDown,
	CircleCheck,
	CircleX,
	MapPin,
} from "lucide-react";
import type { ComponentType } from "react";

export const dynamic = "force-static";

const journeyCards = [
	{
		title: "Create Your 3D Avatar",
		description:
			"Upload a high-res photo to generate a pixel-perfect digital twin with your exact measurements.",
		cta: "Begin Scanning",
		icon: Camera,
	},
	{
		title: "Setup Your Event",
		description:
			"Sync your gala, wedding, or fashion week schedule to receive personalized wardrobe curations.",
		cta: "Sync Calendar",
		icon: CalendarDays,
	},
	{
		title: "Virtual Try-On",
		description:
			"Simulate fabric physics and drape to see exactly how luxury garments move on your body.",
		cta: "Open Fitting Room",
		icon: Box,
	},
	{
		title: "Shop Local",
		description:
			"Reserve your favorites at elite boutiques nearby for an in-person VIP styling session.",
		cta: "Find Boutiques",
		icon: MapPin,
	},
];

const plans = [
	{
		tier: "Essential",
		price: "$0",
		period: "/mo",
		features: [
			{ text: "1 HD Avatar Creation", available: true },
			{ text: "Standard Catalog Access", available: true },
			{ text: "3D File Export", available: false },
		],
		button: "Select Plan",
		featured: false,
		elite: false,
	},
	{
		tier: "Couture Pro",
		price: "$29",
		period: "/mo",
		features: [
			{ text: "Unlimited Avatar Variants", available: true },
			{ text: "Full Designer Catalog", available: true },
			{ text: "3D Exports (OBJ/GLB)", available: true },
		],
		button: "Get Started Pro",
		featured: true,
		elite: false,
	},
	{
		tier: "Elite Concierge",
		price: "$99",
		period: "/yr",
		features: [
			{ text: "Personal AI Stylist", available: true },
			{ text: "VIP Boutique Access", available: true },
			{ text: "Early Collection Access", available: true },
		],
		button: "Join Elite",
		featured: false,
		elite: true,
	},
];

function JourneyCard({
	title,
	description,
	cta,
	icon: Icon,
}: {
	title: string;
	description: string;
	cta: string;
	icon: ComponentType<{ className?: string }>;
}) {
	return (
		<div className='group flex flex-col gap-6 rounded-3xl border border-[#302839] bg-[#191022] p-8 transition-all hover:-translate-y-2 hover:border-primary/50'>
			<div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white'>
				<Icon className='size-7' />
			</div>
			<div className='flex flex-col gap-3'>
				<h4 className='text-xl leading-tight font-bold text-white'>{title}</h4>
				<p className='text-base leading-relaxed text-slate-400'>
					{description}
				</p>
			</div>
			<a
				className='mt-auto flex items-center gap-2 text-sm font-bold tracking-tighter text-primary uppercase'
				href='#'
			>
				{cta}
				<ArrowRight className='size-4' />
			</a>
		</div>
	);
}

function PricingCard({
	tier,
	price,
	period,
	features,
	button,
	featured,
	elite,
}: {
	tier: string;
	price: string;
	period: string;
	features: Array<{ text: string; available: boolean }>;
	button: string;
	featured: boolean;
	elite: boolean;
}) {
	return (
		<div
			className={`relative flex flex-col gap-8 rounded-3xl p-10 ${
				featured
					? "overflow-hidden border-2 border-primary bg-[#191022]"
					: elite
						? "border border-[#D4AF37] bg-[#0a080c] transition-colors hover:bg-[#191022]"
						: "border border-[#302839] bg-[#0a080c] transition-colors hover:border-slate-700"
			}`}
		>
			{featured ? (
				<div className='absolute top-0 right-0 rounded-bl-xl bg-primary px-6 py-2 text-[10px] font-black tracking-widest text-white uppercase'>
					Most Popular
				</div>
			) : null}

			<div className='flex flex-col gap-2'>
				<h4
					className={`text-xs font-bold tracking-widest uppercase ${elite ? "text-[#D4AF37]" : featured ? "text-primary" : "text-slate-400"}`}
				>
					{tier}
				</h4>
				<div className='flex items-baseline gap-1'>
					<span className='text-5xl font-black text-white'>{price}</span>
					<span className='text-lg font-medium text-slate-500'>{period}</span>
				</div>
			</div>

			<ul className='flex flex-col gap-4'>
				{features.map((feature) => (
					<li
						key={feature.text}
						className={`flex items-center gap-3 ${feature.available ? "text-slate-300" : "text-slate-500 line-through"}`}
					>
						{feature.available ? (
							<CircleCheck
								className={`size-5 ${elite ? "text-[#D4AF37]" : "text-primary"}`}
							/>
						) : (
							<CircleX className='size-5' />
						)}
						{feature.text}
					</li>
				))}
			</ul>

			<button
				className={`h-14 w-full rounded-full text-sm font-bold tracking-widest uppercase transition-all ${
					featured
						? "bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105"
						: elite
							? "bg-[#D4AF37] text-black hover:scale-105"
							: "border border-[#302839] text-white hover:bg-white hover:text-black"
				}`}
			>
				{button}
			</button>
		</div>
	);
}

export default function Home() {
	return (
		<main className='flex-1 overflow-hidden'>
			<section className='relative p-0 sm:p-6'>
				<div
					className='relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden rounded-none bg-cover bg-center bg-no-repeat p-8 text-center sm:rounded-3xl lg:bg-top'
					style={{
						backgroundImage:
							'linear-gradient(to bottom, rgba(10, 8, 12, 0.4) 0%, rgba(10, 8, 12, 0.9) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAa_oUv3dqQahWJUTzkbi6mF-6b8PG9geVvaktCHqelL0icavCd0T0bNgVZT27jpk3_m_MEZEiyuui_fg_ToogJfxujMqGvmmhP-QBomnOnxxiMHVCp3Ab3QekM2vzATNCdPUaMWpfZNQorZU2kDtVXv2XWIv1hX7aILuHUWNlnbR7ltz5bxzHt-xfL2ZgwM6yl04dRBIfBhXTL2sZxL2mJD2FAl_2doEea4oXkXXDR5g7w73rA0iEiQsEB_ys0mzlRFVqLeAv5ZXI")',
					}}
				>
					<div className='pointer-events-none absolute inset-0 bg-linear-to-r from-primary/10 to-transparent' />
					<div className='relative z-10 flex max-w-4xl flex-col gap-6'>
						<span className='text-sm font-bold tracking-[0.3em] text-[#D4AF37] uppercase'>
							Experience the Future of Couture
						</span>
						<h1 className='text-5xl leading-none font-black tracking-[-0.05em] text-white sm:text-6xl lg:text-8xl'>
							Your Style,
							<br />
							<span className='italic text-primary'>Virtually</span> Perfect.
						</h1>
						<p className='mx-auto max-w-2xl text-lg leading-relaxed font-medium text-slate-300 sm:text-xl'>
							Precision 3D body scanning and high-fidelity rendering for the
							ultimate virtual fitting room experience.
						</p>
						<div className='mt-4 flex flex-wrap justify-center gap-4'>
							<button className='h-14 min-w-45 rounded-full bg-primary px-8 text-base font-bold tracking-widest text-white uppercase shadow-xl shadow-primary/20 transition-transform hover:scale-105'>
								Get Started
							</button>
							<button className='h-14 min-w-45 rounded-full border border-white/20 bg-white/10 px-8 text-base font-bold tracking-widest text-white uppercase backdrop-blur-md transition-all hover:bg-white/20'>
								View Showcase
							</button>
						</div>
					</div>
					<div className='absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce'>
						<ChevronsDown className='size-8 text-slate-400' />
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-350 px-6 py-24'>
				<div className='mb-16 flex flex-col items-center gap-2 text-center'>
					<h2 className='text-sm font-bold tracking-widest text-primary uppercase'>
						The Digital Atelier
					</h2>
					<h3 className='text-4xl leading-tight font-black tracking-tight text-white sm:text-5xl'>
						Your Core Journey
					</h3>
					<div className='mt-4 h-1 w-20 bg-primary' />
				</div>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
					{journeyCards.map((card) => (
						<JourneyCard key={card.title} {...card} />
					))}
				</div>
			</section>

			<section className='bg-[#191022]/50 py-24'>
				<div className='mx-auto max-w-350 px-6'>
					<div className='mb-16 flex flex-col gap-4'>
						<h3 className='text-3xl font-bold tracking-tight text-white'>
							Luxury Access Plans
						</h3>
						<p className='max-w-xl text-slate-400'>
							Choose the tier that matches your style ambitions. From digital
							hobbyists to fashion industry elites.
						</p>
					</div>
					<div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
						{plans.map((plan) => (
							<PricingCard key={plan.tier} {...plan} />
						))}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-350 px-6 py-24'>
				<div className='relative flex flex-col items-center justify-between gap-12 overflow-hidden rounded-[3rem] border border-primary/20 bg-primary/10 p-12 lg:flex-row lg:p-20'>
					<div className='absolute -right-24 -bottom-24 size-96 rounded-full bg-primary/20 blur-[100px]' />
					<div className='relative z-10 flex max-w-xl flex-col gap-6'>
						<h2 className='text-4xl leading-none font-black tracking-tight text-white lg:text-5xl'>
							Join the Digital Revolution
						</h2>
						<p className='text-lg text-slate-300'>
							Be the first to know about new collection drops, exclusive virtual
							events, and 3D fashion insights.
						</p>
						<div className='flex flex-col gap-3 sm:flex-row'>
							<input
								className='h-14 flex-1 rounded-full border border-[#302839] bg-[#0a080c] px-8 text-white focus:border-primary focus:ring-primary'
								type='email'
								placeholder='Enter your email address'
							/>
							<button className='h-14 rounded-full bg-primary px-10 font-bold tracking-widest text-white uppercase whitespace-nowrap'>
								Subscribe
							</button>
						</div>
					</div>
					<div
						className='relative z-10 size-64 rotate-6 rounded-3xl bg-cover bg-center shadow-2xl lg:size-80'
						style={{
							backgroundImage:
								'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBSVWfcoczu3kQr5oF-LQlIUqJD2nDhkfSlnwnkGjEk67XHSQ1vE2btBYLnrcQQKrIXPEcltUReWWGDwlARUjb-JdGitlyLHB8xZGYZR7cKZmkyX29Eq5g3pkmm-DaqmU9Oi7p1DK7ZU4Pt0xlGjYxvFrKOYnPxZmo4MfHDdkTdHa5L0SyuuzR8Z4XulIUWr_Wwujz5PFLmsV6avRXX1WD06WEaXBT4JZ9BkG8Fz08Szq2S9i6c-tMTK1_ntxF-FbHkZ7vbXWU3cV0")',
						}}
					/>
				</div>
			</section>
		</main>
	);
}
