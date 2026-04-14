import type { NavLinkItem } from "@/types/common";

export const MAIN_NAV: NavLinkItem[] = [
  { label: "Avatar Studio", icon: "person_pin", href: "/avatar_studio" },
  { label: "Outfit Compare", icon: "compare_arrows", href: "/outfit_comparison" },
  { label: "Public View", icon: "language", href: "/public_view" },
  { label: "Recently Worn", icon: "history", href: "/recently_worn" },
];

export const ACCOUNT_NAV: NavLinkItem[] = [
  { label: "Settings", icon: "settings" },
  { label: "Help Center", icon: "help" },
  { label: "Sign Out", icon: "logout" },
];
