"use client";

import { Search, ShoppingBag } from "lucide-react";

import { Logo } from "./Logo";
// import { ThemeToggle } from "./theme/toggle-theme";

const Header = () => {
	return (
		<header className='sticky top-0 z-50 flex items-center justify-between border-b border-[#302839] bg-[#0a080c]/80 px-6 py-4 backdrop-blur-md lg:px-10'>
			<div className='flex items-center gap-8 lg:gap-12'>
				<div className='flex items-center gap-3 text-white'>
					{/* <Sparkles className='size-7 text-primary' /> */}
					<Logo className='size-7' />
					<h2 className='text-xl leading-tight font-black tracking-tighter text-white uppercase'>
						Tryora
					</h2>
				</div>
				<nav className='hidden items-center gap-8 md:flex lg:gap-10'>
					<a
						className='text-sm font-semibold tracking-widest text-slate-300 uppercase transition-colors hover:text-primary'
						href='#'
					>
						Create Avatar
					</a>
					<a
						className='text-sm font-semibold tracking-widest text-slate-300 uppercase transition-colors hover:text-primary'
						href='#'
					>
						Browse Catalog
					</a>
					<a
						className='text-sm font-semibold tracking-widest text-slate-300 uppercase transition-colors hover:text-primary'
						href='#'
					>
						My Renders
					</a>
				</nav>
			</div>

			<div className='flex flex-1 items-center justify-end gap-4 lg:gap-6'>
				<label className='hidden h-10 min-w-40 max-w-64 flex-col lg:flex'>
					<div className='flex h-full w-full items-stretch overflow-hidden rounded-full border border-[#302839] bg-[#191022]'>
						<div className='flex items-center justify-center pl-4 text-slate-400'>
							<Search className='size-5' />
						</div>
						<input
							className='form-input min-w-0 flex-1 border-none bg-transparent pl-2 text-sm font-normal text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none'
							placeholder='Search trends...'
							defaultValue=''
						/>
					</div>
				</label>

				<div className='flex items-center gap-3 border-l border-[#302839] pl-4 lg:gap-4 lg:pl-6'>
					<button
						className='text-slate-100 transition-colors hover:text-primary'
						aria-label='Open shopping bag'
					>
						<ShoppingBag className='size-5' />
					</button>
					<div
						className='size-10 cursor-pointer rounded-full border-2 border-primary/50 bg-cover bg-center bg-no-repeat'
						style={{
							backgroundImage:
								'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBI0UaaHvoIoZ1O8-aqsFLrxOHhA1e4i4unSstFQoAfzAD5GKi8jgS_0wUUFMmM9cKD_fgEd1ZjRFPL7dUADmAi9SH6s80GMaT000edHD5b08z2C6C9UK0knNG-eF_9idn1-vaLK3UtX3CzcM9KIU410Sqc-L-yN_kNGJd2PhC-MkywBoIHKh-WwCozkwwgIoEfr8jKiNHZZghsL_wQyU9Yq3BbRCzpG_mINSADGkbkNtQJGxP_cW5pER2ytonrolmcet_9R_NkPnA")',
						}}
					/>
				</div>
			</div>
		</header>
	);
};

export default Header;
