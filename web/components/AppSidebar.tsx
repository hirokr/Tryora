"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  
  { href: "/discover", label: "Style Discovery", icon: "palette" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/trending", label: "Trending", icon: "trending_up" },
  { href: "/search/history", label: "Search History", icon: "history" },
  { href: "/marketplace", label: "Marketplace", icon: "storefront" },
  { href: "/wardrobe", label: "Wardrobe", icon: "checkroom" },
  { href: "/public-view", label: "Public View", icon: "language" },
  { href: "/outfit-comparison", label: "Outfit Comparison", icon: "compare_arrows" },
  
];

export default function AppSidebar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <aside className="fixed left-4 top-24 z-40 hidden h-[calc(100vh-7rem)] w-60 overflow-y-auto rounded-2xl border border-primary/20 bg-[#160f22]/90 p-3 backdrop-blur-xl xl:block">
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Navigate
      </p>
      <nav className="space-y-1">
        {LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary/20 text-white"
                  : "text-slate-300 hover:bg-primary/10 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-base">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
// This component, `AppSidebar`, is responsible for rendering a sidebar navigation menu for the Tryora application. It uses Next.js's `Link` component for client-side navigation and `usePathname` to determine the current active route. The sidebar includes links to various sections of the app, such as Dashboard, Style Discovery, Search, Trending, Search History, Marketplace, Wardrobe, Public View, and Outfit Comparison. The active link is highlighted with a different background and text color. The sidebar is designed to be responsive and only appears on larger screens (hidden on smaller screens).