import type {
  AestheticTag,
  SettingsNavItem,
  StylingCategory,
  StylingProduct,
  WardrobeItem,
} from "@/types/experience";

export const SETTINGS_NAV: SettingsNavItem[] = [
  { icon: "person", label: "Profile", href: "#" },
  { icon: "view_in_ar", label: "3D Preferences", href: "#" },
  { icon: "security", label: "Account Security", href: "#" },
  { icon: "notifications", label: "Notifications", href: "#" },
];

export const STYLE_DISCOVERY_AESTHETICS: AestheticTag[] = [
  { label: "Formal" },
  { label: "Casual Chic" },
  { label: "Avant-Garde" },
  { label: "Business" },
  { label: "Minimalist" },
  { label: "Bohemian Luxe" },
];

export const STYLE_DISCOVERY_GRID_IMAGES: string[] = [
  "/style%20discovery/style%20discovery%201.png",
  "/style%20discovery/style%20discovery%202.png",
  "/style%20discovery/style%20discovery%203.png",
  "/style%20discovery/style%20discovery%204.png",
];

export const STYLING_CATEGORIES: StylingCategory[] = [
  "Avant-Garde",
  "Cyberpunk",
  "Minimalist",
  "High-Fashion",
];

export const STYLING_PRODUCTS: Record<StylingCategory, StylingProduct[]> = {
  "Avant-Garde": [
    {
      name: "Asymmetric Metallic Coat",
      sub: "Experimental Outerwear",
      price: "BDT 45,500",
      img: "/Styling%20secession/styling%20secession%201.png",
    },
    {
      name: "Sculptural Drape Trousers",
      sub: "Geometric Tailoring",
      price: "BDT 22,800",
      img: "/Styling%20secession/styling_secession%202.png",
    },
    {
      name: "Architectural Platform Boots",
      sub: "Futuristic Footwear",
      price: "BDT 32,400",
      img: "/Styling%20secession/styling%20secession%203.png",
    },
  ],
  Cyberpunk: [
    {
      name: "Neon Utility Jacket",
      sub: "Street Layer",
      price: "BDT 9,900",
      img: "/Styling%20secession/styling%20secession%204.png",
      badge: "Trending",
    },
    {
      name: "Reflective Cargo Pants",
      sub: "Tactical Bottom",
      price: "BDT 7,400",
      img: "/Styling%20secession/styling%20secession%205.png",
    },
    {
      name: "Pulse Runner Sneakers",
      sub: "Urban Footwear",
      price: "BDT 6,300",
      img: "/Styling%20secession/styling%20secession%206.png",
    },
  ],
  Minimalist: [
    {
      name: "Stone Wool Overcoat",
      sub: "Tailored Outer",
      price: "BDT 14,200",
      img: "/Styling%20secession/styling%20secession%207.png",
    },
    {
      name: "Straight-Leg Trousers",
      sub: "Daily Essentials",
      price: "BDT 5,800",
      img: "/Styling%20secession/styling%20secession%208.png",
      badge: "Perfect Match",
    },
    {
      name: "Leather Loafers",
      sub: "Classic Shoe",
      price: "BDT 8,700",
      img: "/Styling%20secession/styling%20secession%209.png",
    },
  ],
  "High-Fashion": [
    {
      name: "Silk Evening Gown",
      sub: "Luxury Eveningwear",
      price: "BDT 12,500",
      img: "/Styling%20secession/styling%20secession%2010.png",
      badge: "Perfect Match",
    },
    {
      name: "Pearl Essence Necklace",
      sub: "Fine Jewelry",
      price: "BDT 2,800",
      img: "/Styling%20secession/styling%20secession%2011.png",
    },
    {
      name: "Classique Gold Watch",
      sub: "Luxury Timepieces",
      price: "BDT 18,500",
      img: "/Styling%20secession/styling%20secession%203.png",
    },
  ],
};

export const STYLING_AVATAR_BY_CATEGORY: Record<StylingCategory, string> = {
  "Avant-Garde": "/Styling%20secession/styling%20secession%201.png",
  Cyberpunk: "/Styling%20secession/styling%20secession%204.png",
  Minimalist: "/Styling%20secession/styling%20secession%207.png",
  "High-Fashion": "/Styling%20secession/styling%20secession%2010.png",
};

export const UPDATE_PICS_REFERENCE_IMAGES = {
  front: "/upload%20img/upload%20image.png",
  side: "/style%20discovery/style%20discovery%201.png",
  back: "/style%20discovery/style%20discovery%202.png",
};

export const WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: 1,
    name: "Evening Blazer",
    category: "Tops • Structured Fit",
    badge: "VTON Ready",
    badgeStyle: "primary",
    img: "/wardrobe/wardrobe%201.png",
    alt: "Model wearing a minimalist charcoal gray wool overcoat",
    liked: false,
  },
  {
    id: 2,
    name: "Pleated Trousers",
    category: "Bottoms • Regular Fit",
    badge: "VTON Ready",
    badgeStyle: "primary",
    img: "/wardrobe/wardrobe%202.png",
    alt: "High waist tailored black trousers on a neutral background",
    liked: false,
  },
  {
    id: 3,
    name: "Hobo Day Bag",
    category: "Accessories • Leather",
    badge: "Limited Support",
    badgeStyle: "muted",
    img: "/wardrobe/wardrobe%203.png",
    alt: "Luxury beige leather handbag with gold hardware details",
    liked: true,
  },
  {
    id: 4,
    name: "Essential Oxford",
    category: "Tops • Cotton",
    badge: "VTON Ready",
    badgeStyle: "primary",
    img: "/wardrobe/wardrobe%204.png",
    alt: "Classic white cotton button-down shirt ironed flat",
    liked: false,
  },
];
