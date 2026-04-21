import type { SearchProduct } from "@/types/search";

export type FeedProduct = SearchProduct & {
  likeCount?: number;
  viewCount?: number;
  tryOnUrl?: string | null;
};

export type FeedCardHandlers = {
  onViewed: (product: FeedProduct) => void | Promise<void>;
  onLike: (product: FeedProduct) => void | Promise<void>;
  onFavoriteToggle: (product: FeedProduct) => void;
};
