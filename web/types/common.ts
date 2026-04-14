export interface HairStyle {
  label: string;
  img: string;
}

export interface BodySlider {
  label: string;
  value: string;
}

export interface MotionMode {
  label: string;
  icon: string;
}

export interface NavLinkItem {
  label: string;
  icon: string;
  href?: string;
  active?: boolean;
}

export interface StyleCategory {
  label: string;
  pct: number;
}

export interface OutfitCardItem {
  id: number;
  name: string;
  img: string;
  alt: string;
  time?: string;
  price?: string;
}

export interface TimelineItem {
  id: number;
  date: string;
  name: string;
  tags: string[];
  badge?: boolean;
  worn?: boolean;
  faded?: boolean;
  img: string;
  alt: string;
}

export interface OutfitJob {
  label: string;
  progress?: number;
  queued?: boolean;
}

export interface MeasurementItem {
  label: string;
  value: string;
}

export type NotificationState = "none" | "progress" | "error";

export type TabType = "sync" | "free";
