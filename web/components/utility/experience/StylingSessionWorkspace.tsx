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
  generatedTryOnImageUrl?: string | null;
};

type StylingRecommendationsProps = {
  products: StylingProduct[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  selectedProductIds: string[];
  onToggleProduct: (productId: string) => void;
  onViewDetails: (productId: string) => void;
  onGenerateTryOn: () => void;
  isGenerating: boolean;
  isLoadingProducts: boolean;
  productsError: string | null;
  generateError: string | null;
};

type StylingEventPanelProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
};

export function StylingEventPanel({ prompt, onPromptChange }: StylingEventPanelProps) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined">auto_awesome</span>
        <h2 className="text-base font-semibold text-white">Event Description</h2>
      </div>
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          className="min-h-24 w-full resize-none rounded-xl border border-primary/20 bg-background-dark px-3 py-3 text-sm text-slate-100 outline-none focus:border-primary"
          placeholder="Describe your event... e.g., Summer Wedding in Sylhet"
        />
      </div>
    </section>
  );
}

export function StylingAvatarPanel({
  avatarSrc,
  showHotspots,
  generatedTryOnImageUrl,
}: StylingAvatarPanelProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background-dark">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      <div className="relative mx-auto flex h-[320px] w-full max-w-md items-center justify-center sm:h-[420px]">
        <Image
          src={generatedTryOnImageUrl || avatarSrc}
          alt="Styling avatar"
          fill
          className="object-contain p-4"
        />

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
  selectedProductIds,
  onToggleProduct,
  onViewDetails,
  onGenerateTryOn,
  isGenerating,
  isLoadingProducts,
  productsError,
  generateError,
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
        <button
          onClick={onGenerateTryOn}
          disabled={isGenerating || selectedProductIds.length === 0}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>
      {productsError ? <p className="mb-3 text-sm text-red-300">{productsError}</p> : null}
      {generateError ? <p className="mb-3 text-sm text-red-300">{generateError}</p> : null}

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

      {isLoadingProducts ? <p className="mb-4 text-sm text-slate-300">Loading products...</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={`${product.id || product.name}`}
            className={`overflow-hidden rounded-xl border transition-all ${
              product.id && selectedProductIds.includes(product.id)
                ? "border-primary/70 bg-primary/10"
                : "border-primary/10 bg-background-dark hover:border-primary/40"
            }`}
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
                <div className="flex items-center gap-2">
                  {product.id ? (
                    <button
                      onClick={() => onViewDetails(product.id as string)}
                      className="rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
                    >
                      Details
                    </button>
                  ) : null}
                  {product.id ? (
                    <button
                      onClick={() => onToggleProduct(product.id as string)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
                    >
                      {selectedProductIds.includes(product.id) ? "Selected" : "Select"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
