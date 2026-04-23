"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ProtectedNavItem = {
	href?: string;
	label: string;
	match: (pathname: string) => boolean;
};

const PROTECTED_NAV_ITEMS: ProtectedNavItem[] = [
	{
		href: "/search",
		label: "Search",
		match: (pathname) => pathname === "/search",
	},
	// {
	// 	href: "/search",
	// 	label: "Search Products (Dynamic)",
	// 	match: (pathname) => /^\/search\/[^/]+\/products$/.test(pathname),
	// },
	{
		href: "/outfit-comparison",
		label: "Outfit Comparison",
		match: (pathname) => pathname === "/outfit-comparison",
	},
	{
		href: "/tryon",
		label: "Try On",
		match: (pathname) => pathname === "/tryon",
	},
	// {
	// 	href: "/tryon",
	// 	label: "Try On Session (Dynamic)",
	// 	match: (pathname) => /^\/tryon\/[^/]+$/.test(pathname),
	// },
	{
		href: "/tryon/image",
		label: "Try On Image",
		match: (pathname) => pathname === "/tryon/image",
	},
	// {
	// 	href: "/tryon/image",
	// 	label: "Image Edit (Dynamic)",
	// 	match: (pathname) => /^\/tryon\/image-edit\/[^/]+$/.test(pathname),
	// },
	{
		href: "/tryon/model",
		label: "Model",
		match: (pathname) => pathname === "/tryon/model",
	},
	{
		href: "/tryon/model/avatar-studio",
		label: "Avatar Studio",
		match: (pathname) => pathname.startsWith("/tryon/model/avatar-studio"),
	},
];

export default function ProtectedSidebar() {
	const pathname = usePathname();

	return (
		<aside className='fixed left-4 top-24 z-40 hidden h-[calc(100vh-7rem)] w-64 overflow-y-auto rounded-2xl border border-primary/20 bg-[#160f22]/90 p-3 backdrop-blur-xl xl:block'>
			<p className='px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
				Protected Routes
			</p>
			<nav className='flex flex-col gap-1'>
				{PROTECTED_NAV_ITEMS.map((item) => {
					const isActive = item.match(pathname);

					if (!item.href) {
						return (
							<div
								key={item.label}
								className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
									isActive ? "bg-primary/20 text-white" : "text-slate-300"
								}`}
							>
								{item.label}
							</div>
						);
					}

					return (
						<Link
							key={item.label}
							href={item.href}
							className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
								isActive
									? "bg-primary/20 text-white"
									: "text-slate-300 hover:bg-primary/10 hover:text-white"
							}`}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
