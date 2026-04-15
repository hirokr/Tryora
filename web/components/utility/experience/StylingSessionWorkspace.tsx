"use client";

import Image from "next/image";
import type { StylingProduct } from "@/types/experience";

function Hotspot({ top, left, label }: { top: string; left: string; label: string }) {
  return (
    <div className="group absolute z-20 cursor-pointer" style={{ top, left }}>
      <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-primary opacity-40" />
      <span className="relative block h-4 w-4 rounded-full border-2 border-white/60 bg-primary" />
      <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-primary/30 bg-black/60 px-3 py-1 text-xs font-bold text-slate-100 backdrop-blur-md group-hover:block">
        {label}
      </div>
    </div>
  );
}

type StylingAvatarPanelProps = {
  avatarSrc: string;
  showHotspots: boolean;
};

type StylingRecommendationsProps = {
  products: StylingProduct[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
};

export function StylingEventPanel() {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined">auto_awesome</span>
        <h2 className="text-base font-semibold text-white">Event Description</h2>
      </div>
      <div className="relative">
        <textarea
          className="min-h-24 w-full resize-none rounded-xl border border-primary/20 bg-background-dark px-3 py-3 text-sm text-slate-100 outline-none focus:border-primary"
          placeholder="Describe your event... e.g., Summer Wedding in Sylhet"
        />
        <button className="absolute bottom-3 right-3 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/90">
          Get Recommendations
        </button>
      </div>
    </section>
  );
}

export function StylingAvatarPanel({ avatarSrc, showHotspots }: StylingAvatarPanelProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background-dark">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      <div className="relative mx-auto flex h-[320px] w-full max-w-md items-center justify-center sm:h-[420px]">
        <Image src={avatarSrc} alt="Styling avatar" fill className="object-contain p-4" />

        {showHotspots && (
          <>
            <Hotspot top="26%" left="62%" label="Metallic Asymm Coat" />
            <Hotspot top="58%" left="45%" label="Structural Trousers" />
            <Hotspot top="82%" left="54%" label="Architectural Boots" />
          </>
        )}
      </div>
    </section>
  );
}

export function StylingRecommendationsPanel({
  products,
  categories,
  activeCategory,
  onSelectCategory,
}: StylingRecommendationsProps) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-white/5 p-4 backdrop-blur-md">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">shopping_bag</span>
          <h3 className="font-bold text-white">Fetched Recommendations</h3>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
            {products.length} Items Found
          </span>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeCategory === cat
                ? "bg-primary text-white"
                : "border border-primary/20 bg-primary/10 text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.name}
            className="overflow-hidden rounded-xl border border-primary/10 bg-background-dark transition-all hover:border-primary/40"
          >
            <div className="relative h-48 w-full">
              <Image src={product.img} alt={product.name} fill className="object-cover" />
              {product.badge && (
                <span className="absolute left-3 top-3 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {product.badge}
                </span>
              )}
            </div>
            <div className="space-y-1 p-3">
              <h4 className="truncate text-sm font-bold text-slate-100">{product.name}</h4>
              <p className="text-xs text-slate-500">{product.sub}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-primary">{product.price}</span>
                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90">
                  Try On
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
