import Link from "next/link";

import type { SearchProduct } from "@/types/search";

type SearchProductCardProps = {
  product: SearchProduct;
};

export function SearchProductCard({ product }: SearchProductCardProps) {
  const destination = product.id ? `/search/product/${product.id}` : undefined;
  const buyUrl = product.productUrl || product.link || "#";

  return (
    <article className="overflow-hidden rounded-2xl border border-primary/20 bg-white/5">
      <div className="aspect-[4/3] bg-black/30">
        {product.image ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-sm font-semibold text-white">{product.title}</p>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
          <span>{product.brand || product.category || "Fashion"}</span>
          <span>
            {product.price ? `${product.price} ${product.currency || ""}`.trim() : "Price unavailable"}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {destination ? (
            <Link
              href={destination}
              className="inline-flex items-center rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              View details
            </Link>
          ) : null}
          {buyUrl !== "#" ? (
            <a
              href={buyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Open store
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
