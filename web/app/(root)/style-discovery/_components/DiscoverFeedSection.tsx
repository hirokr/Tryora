import Link from "next/link";
import type { RefObject } from "react";

import { SearchProductCard } from "@/components/utility/search/SearchProductCard";

import type { FeedCardHandlers, FeedProduct } from "../../../../types/feedTypes";

type DiscoverFeedSectionProps = {
  items: FeedProduct[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loaderRef: RefObject<HTMLDivElement | null>;
  likeCounts: Record<string, number>;
  viewCounts: Record<string, number>;
  favourites: Record<string, boolean>;
} & FeedCardHandlers;

export function DiscoverFeedSection({
  items,
  isLoading,
  error,
  hasMore,
  loaderRef,
  likeCounts,
  viewCounts,
  favourites,
  onViewed,
  onLike,
  onFavoriteToggle,
}: DiscoverFeedSectionProps) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Discover</p>
          <h2 className="text-xl font-bold text-white">Public product feed</h2>
        </div>
        <Link
          href="/search"
          className="rounded-lg border border-primary/40 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          Open search
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product, index) => (
          <SearchProductCard
            key={product.id || `${product.title}-${index}`}
            product={product}
            likeCount={likeCounts[product.id || ""]}
            viewCount={viewCounts[product.id || ""]}
            isFavorited={Boolean(favourites[product.id || ""])}
            tryOnHref={product.tryOnUrl || product.productUrl || undefined}
            onViewed={onViewed}
            onLike={onLike}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-300">Loading more products...</p> : null}
      {!hasMore && items.length > 0 ? (
        <p className="mt-4 text-sm text-slate-400">You reached the end of discover products.</p>
      ) : null}
      <div ref={loaderRef} className="h-4" />
    </section>
  );
}
