"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { WardrobeItem } from "@/types/experience";

type WardrobeToolbarProps = {
  activeTab: "favourite" | "tryon";
  setActiveTab: (tab: "favourite" | "tryon") => void;
  activeCategories: Array<"All" | "Cloth" | "Accessaries" | "Shoes" | "Other">;
  onCategoryToggle: (category: "All" | "Cloth" | "Accessaries" | "Shoes" | "Other") => void;
};

const CATEGORY_OPTIONS: Array<"All" | "Cloth" | "Accessaries" | "Shoes" | "Other"> = [
  "All",
  "Cloth",
  "Accessaries",
  "Shoes",
  "Other",
];

export function WardrobeToolbar({
  activeTab,
  setActiveTab,
  activeCategories,
  onCategoryToggle,
}: WardrobeToolbarProps) {
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    if (!showCategories) return;

    const timeoutId = window.setTimeout(() => {
      setShowCategories(false);
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showCategories, activeCategories]);

  return (
    <section className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full gap-2 rounded-lg bg-surface p-1 sm:w-fit">
        <button
          onClick={() => setActiveTab("favourite")}
          className={`rounded-md px-5 py-2 text-sm font-medium ${
            activeTab === "favourite" ? "bg-primary text-white" : "text-slate-400"
          }`}
        >
          Favourite
        </button>
        <button
          onClick={() => setActiveTab("tryon")}
          className={`rounded-md px-5 py-2 text-sm font-medium ${
            activeTab === "tryon" ? "bg-primary text-white" : "text-slate-400"
          }`}
        >
          Try On
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowCategories((current) => !current)}
          className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-bold text-white flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Category
        </button>

        {showCategories ? (
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryToggle(category)}
                className={`rounded-lg border px-4 py-2 text-sm font-bold ${
                  activeCategories.includes(category)
                    ? "border-primary bg-primary text-white"
                    : "border-primary/20 bg-surface text-slate-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <span className="rounded-lg border border-primary/20 bg-surface px-4 py-2 text-sm text-slate-300">
            {activeCategories.includes("All") ? "All" : activeCategories.join(", ")}
          </span>
        )}
      </div>
    </section>
  );
}

type WardrobeGridProps = {
  items: WardrobeItem[];
};

export function WardrobeGrid({ items }: WardrobeGridProps) {
  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="group overflow-hidden rounded-xl border border-primary/10 bg-surface transition-all hover:border-primary/40"
        >
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image src={item.img} alt={item.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <button className="absolute bottom-4 left-4 right-4 translate-y-4 rounded-lg bg-primary py-2 text-sm font-bold text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
              AI TRY ON
            </button>
          </div>
          <div className="p-4">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="text-lg font-medium text-slate-100">{item.name}</h3>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  item.badgeStyle === "primary" ? "bg-primary/20 text-primary" : "bg-slate-700 text-slate-300"
                }`}
              >
                {item.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400">{item.category}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
