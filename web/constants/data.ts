import type {
  BodySlider,
  HairStyle,
  MeasurementItem,
  MotionMode,
  NavLinkItem,
  OutfitCardItem,
  OutfitJob,
  StyleCategory,
  TimelineItem,
} from "@/types/common";

export const SKIN_TONES: string[] = ["#F3D7C6", "#D2A07B", "#A66A43", "#5C3A2A"];

export const MOTION_MODES: MotionMode[] = [
  { label: "Walk", icon: "directions_walk" },
  { label: "Sit", icon: "airline_seat_recline_normal" },
  { label: "Pose", icon: "accessibility" },
];

export const AVATAR_BODY_SLIDERS: BodySlider[] = [
  { label: "Height (cm)", value: "178.5" },
  { label: "Shoulder Width", value: "44.2" },
  { label: "Waist Circumference", value: "82.0" },
  { label: "Inseam", value: "84.5" },
];

export const HAIR_STYLES: HairStyle[] = [
  { label: "Short Buzz", img: "/avatar/avatar_customization%201.png" },
  { label: "Pompadour", img: "/avatar/avatar_customization%202.png" },
  { label: "Classic Wavy", img: "/avatar/avatar_customization%203.png" },
];

export const AVATAR_STUDIO_NAV_LINKS: NavLinkItem[] = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Avatar Studio", icon: "person_pin", active: true },
  { label: "Wardrobe", icon: "checkroom" },
  { label: "Search", icon: "search" },
];

export const AVATAR_RESULT_NAV_LINKS: NavLinkItem[] = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Avatar Studio", icon: "person_celebrate", active: true },
  { label: "Wardrobe", icon: "checkroom" },
  { label: "Search", icon: "search" },
];

export const MANUAL_OVERRIDE_MEASUREMENTS: MeasurementItem[] = [
  { label: "Height", value: "178 CM" },
  { label: "Chest", value: "98 CM" },
  { label: "Waist", value: "82 CM" },
  { label: "Hips", value: "102 CM" },
];

export const AVATAR_RESULT_SUMMARY = {
  confidenceScore: "98%",
  landmarksDetected: "500+",
  processTime: "1.2s",
};

export const STYLE_CATEGORIES: StyleCategory[] = [
  { label: "Streetwear", pct: 72 },
  { label: "Formal", pct: 58 },
  { label: "Athleisure", pct: 44 },
  { label: "Minimal", pct: 37 },
];

export const DASHBOARD_RECENT_OUTFITS: OutfitCardItem[] = [
  {
    id: 1,
    name: "Formal Cyber",
    time: "2 hours ago",
    img: "/avatar/avatar_result1.png",
    alt: "Fashion portrait in a formal futuristic outfit",
  },
  {
    id: 2,
    name: "Neon Streetwear",
    time: "Yesterday",
    img: "/avatar/avatar_studio%201.png",
    alt: "Streetwear outfit render with vibrant colors",
  },
  {
    id: 3,
    name: "Obsidian Drape",
    time: "3 days ago",
    img: "/avatar/avatar_customization%202.png",
    alt: "High fashion coat with textured layers",
  },
];

export const DASHBOARD_JOB_QUEUE: OutfitJob[] = [
  { label: "VTON: Cyber-Coat v2", progress: 84 },
  { label: "Scene: Tokyo Neon Nights", queued: true },
  { label: "Texture: Metallic Silver Silk", queued: true },
];

export const PUBLIC_VIEW_OUTFIT_ITEMS: OutfitCardItem[] = [
  {
    id: 1,
    name: "Neo-Jacket V.2",
    price: "6,500 BDT",
    img: "/avatar/avatar_customization%201.png",
    alt: "Futuristic bomber jacket detail",
  },
  {
    id: 2,
    name: "Void Joggers",
    price: "4,200 BDT",
    img: "/avatar/avatar_customization%202.png",
    alt: "Dark techwear joggers",
  },
  {
    id: 3,
    name: "Pulse Runners",
    price: "8,900 BDT",
    img: "/avatar/avatar_customization%203.png",
    alt: "High-top sneakers with glow accents",
  },
];

export const RECENTLY_WORN_TIMELINE: TimelineItem[] = [
  {
    id: 1,
    date: "Oct 24, 2024",
    name: "Velvet Midnight Gown",
    tags: ["Silk Dress", "Pearl Clutch"],
    badge: true,
    worn: false,
    img: "/avatar/avatar_result1.png",
    alt: "Render of an evening gown outfit",
  },
  {
    id: 2,
    date: "Oct 21, 2024",
    name: "Neo-Tokyo Streetwear",
    tags: ["Tech Hoodie", "Cargo Pants"],
    worn: true,
    img: "/avatar/avatar_studio%201.png",
    alt: "Minimal streetwear outfit render",
  },
  {
    id: 3,
    date: "Oct 18, 2024",
    name: "Ethereal Summer Set",
    tags: ["Linen Top", "Straw Hat"],
    img: "/avatar/avatar_customization%201.png",
    alt: "Light aesthetic outfit render",
  },
  {
    id: 4,
    date: "Oct 12, 2024",
    name: "Corporate Edge Suit",
    tags: ["Blazer", "Trousers"],
    faded: true,
    img: "/avatar/avatar_customization%203.png",
    alt: "Classic tailored suit outfit",
  },
];
