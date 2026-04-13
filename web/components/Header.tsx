"use client";
import Link from "next/link";

import { Search, ShoppingBag } from "lucide-react";

import { Logo } from "./Logo";
// import { ThemeToggle } from "./theme/toggle-theme";

const Header = () => {
	return (
		<header className="fixed top-0 z-50 w-full border-b border-primary/10 bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center" style={{ gap: "7px" }}>
            <img src="/icon0.svg" alt="Tryora Icon" style={{ width: "2rem", height: "2rem" }} />
            <h2 className="font-serif text-2xl font-bold tracking-tight text-white italic">Tryora</h2>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <a className="text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#">Platform</a>
            <a className="text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#">Solutions</a>
            <a className="text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#">Developers</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/signup" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(140,43,238,0.4)]">
              Sign up
            </Link>
          </div>
        </div>
      </header>

	);
};

export default Header;
