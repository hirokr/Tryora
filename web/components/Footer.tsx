import { Camera, Globe, Sparkles } from "lucide-react";
import React from "react";

const Footer = () => {
	return (
		<footer className='border-t border-[#302839] bg-[#0a080c] px-10 py-20'>
			<div className='mx-auto grid max-w-350 grid-cols-1 gap-12 md:grid-cols-4'>
				<div className='col-span-1 flex flex-col gap-6'>
					<div className='flex items-center gap-3 text-white'>
						<Sparkles className='size-7 text-primary' />
						<h2 className='text-xl font-black tracking-tighter text-white uppercase'>
							Luxe 3D
						</h2>
					</div>
					<p className='text-sm leading-relaxed text-slate-500'>
						Defining the next era of fashion through digital precision and
						luxury craftsmanship.
					</p>
					<div className='flex gap-4'>
						{[Globe, Globe, Camera].map((Icon, index) => (
							<a
								key={index}
								className='flex size-10 items-center justify-center rounded-full bg-[#191022] text-slate-400 transition-colors hover:text-primary'
								href='#'
							>
								<Icon className='size-5' />
							</a>
						))}
					</div>
				</div>

				<div className='flex flex-col gap-6'>
					<h4 className='text-sm font-bold tracking-widest text-white uppercase'>
						Platform
					</h4>
					<nav className='flex flex-col gap-3'>
						{[
							"Create Avatar",
							"3D Fitting Room",
							"Browse Catalog",
							"Designer Program",
						].map((item) => (
							<a
								key={item}
								className='text-sm text-slate-500 transition-colors hover:text-white'
								href='#'
							>
								{item}
							</a>
						))}
					</nav>
				</div>

				<div className='flex flex-col gap-6'>
					<h4 className='text-sm font-bold tracking-widest text-white uppercase'>
						Support
					</h4>
					<nav className='flex flex-col gap-3'>
						{[
							"Contact Concierge",
							"Measurement Guide",
							"Terms of Service",
							"Privacy Policy",
						].map((item) => (
							<a
								key={item}
								className='text-sm text-slate-500 transition-colors hover:text-white'
								href='#'
							>
								{item}
							</a>
						))}
					</nav>
				</div>

				<div className='flex flex-col gap-6'>
					<h4 className='text-sm font-bold tracking-widest text-white uppercase'>
						Global Offices
					</h4>
					<p className='text-sm leading-relaxed text-slate-500'>
						Paris • Milan • New York • Tokyo
						<br />
						contact@luxe3d.com
					</p>
				</div>
			</div>

			<div className='mx-auto mt-20 flex max-w-350 flex-col items-center justify-between gap-4 border-t border-[#302839] pt-8 md:flex-row'>
				<p className='text-xs tracking-widest text-slate-600 uppercase'>
					© 2024 LUXE 3D TECHNOLOGY S.A. ALL RIGHTS RESERVED.
				</p>
				<div className='flex gap-8'>
					<span className='text-xs tracking-widest text-slate-600 uppercase'>
						English (US)
					</span>
					<span className='text-xs tracking-widest text-slate-600 uppercase'>
						EUR (€)
					</span>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
