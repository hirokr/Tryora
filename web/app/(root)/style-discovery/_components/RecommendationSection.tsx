import { SearchProductCard } from "@/components/utility/search/SearchProductCard";

import type { FeedCardHandlers, FeedProduct } from "../../../../types/feedTypes";

type RecommendationSectionProps = {
  show: boolean;
  isLoading: boolean;
  items: FeedProduct[];
  likeCounts: Record<string, number>;
  viewCounts: Record<string, number>;
  favourites: Record<string, boolean>;
} & FeedCardHandlers;

export function RecommendationSection({
  show,
  isLoading,
  items,
  likeCounts,
  viewCounts,
  favourites,
  onViewed,
  onLike,
  onFavoriteToggle,
}: RecommendationSectionProps) {
  if (!show) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Recommendation</p>
          <h2 className="text-xl font-bold text-white">Recommended for you</h2>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-300">Loading personalized recommendations...</p>
      ) : (
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
      )}
    </section>
  );
}
