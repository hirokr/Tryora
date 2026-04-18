export interface SettingsNavItem {
  icon: string;
  label: string;
  href: string;
}

export type EnvMode = "dark" | "light";
export type QualityMode = "ultra" | "balanced";

export interface AestheticTag {
  label: string;
}

export type StylingCategory = "Avant-Garde" | "Cyberpunk" | "Minimalist" | "High-Fashion";

export interface StylingProduct {
  id?: string;
  name: string;
  sub: string;
  price: string;
  img: string;
  source?: string;
  currency?: string;
  priceValue?: number;
  productUrl?: string;
  badge?: string;
}

export interface WardrobeItem {
  id: number;
  name: string;
  category: string;
  badge: string;
  badgeStyle: "primary" | "muted";
  img: string;
  alt: string;
  liked: boolean;
}
