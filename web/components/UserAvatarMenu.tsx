"use client";

import Image from "next/image";
import Link from "next/link";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Session } from "@/types/auth";

const USER_LINKS = [
	{ href: "/user/dashboard", label: "Dashboard" },
	{ href: "/user/wardrobe", label: "Wardrobe" },
	{ href: "/user/favourite", label: "Favourite" },
	{ href: "/user/liked", label: "Liked" },
	{ href: "/user/update-pics", label: "Update Pics" },
	{ href: "/user/settings", label: "Settings" },
];

type UserAvatarMenuProps = {
	user: Session["user"];
	signOutAction: () => Promise<void>;
};

function getInitials(name: string) {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

export function UserAvatarMenu({ user, signOutAction }: UserAvatarMenuProps) {
	const initials = getInitials(user.name || user.email || "User");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					className='flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-2 text-left transition-all hover:border-primary/40 hover:bg-primary/10'
				>
					<span className='relative flex size-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-background/80'>
						{user.avatarUrl ? (
							<Image
								src={user.avatarUrl}
								alt={user.name}
								fill
								className='object-cover'
								sizes='40px'
							/>
						) : null}
						<span
							className={cn(
								"flex size-full items-center justify-center bg-primary/15 text-xs font-semibold text-primary",
								user.avatarUrl ? "sr-only" : "",
							)}
						>
							{initials}
						</span>
					</span>
					{/* <span className='hidden max-w-32 flex-col text-left md:flex'>
						<span className='truncate text-sm font-semibold text-white'>
							{user.name}
						</span>
						<span className='truncate text-xs text-slate-300'>
							{user.email}
						</span>
					</span> */}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-56'>
				<DropdownMenuLabel>
					<div className='flex flex-col gap-1'>
						<span className='text-sm font-semibold text-foreground'>
							{user.name}
						</span>
						<span className='text-xs text-muted-foreground'>{user.email}</span>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{USER_LINKS.map((item) => (
					<DropdownMenuItem key={item.href} asChild>
						<Link href={item.href}>{item.label}</Link>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<form action={signOutAction} className='w-full'>
					<DropdownMenuItem variant='destructive' asChild>
						<button type='submit' className='w-full text-left'>
							Sign out
						</button>
					</DropdownMenuItem>
				</form>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
