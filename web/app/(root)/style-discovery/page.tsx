"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  StyleDiscoveryContent,
  StyleDiscoveryInspirationGrid,
} from "@/components/utility/experience/StyleDiscoveryWorkspace";
import {
  SEARCH_RECOMMENDATIONS_STORAGE_KEY,
  STYLE_DISCOVERY_AESTHETIC_STORAGE_KEY,
  STYLE_DISCOVERY_PROMPT_STORAGE_KEY,
} from "@/constants/flow";

import { useStyleDiscovery } from "@/hooks";
import { authFetch } from "@/lib/auth/clientAuthFetch";
import type { SearchResponse } from "@/types/search";

import { DiscoverFeedSection } from "./_components/DiscoverFeedSection";
import { RecommendationSection } from "./_components/RecommendationSection";
import { StyleDiscoveryHero } from "./_components/StyleDiscoveryHero";
import type { FeedProduct } from "../../../types/feedTypes";
import { TrendingTryonsSection } from "./_components/TrendingTryonsSection";

const DISCOVER_PAGE_SIZE = 12;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeFeedProduct(raw: unknown, index: number): FeedProduct {
  const candidate = (raw || {}) as Record<string, unknown>;

  const id =
    String(candidate.id || candidate.productId || candidate._id || `product-${Date.now()}-${index}`);

  return {
    id,
    title: String(candidate.title || candidate.name || candidate.productTitle || "Untitled product"),
    productUrl:
      (candidate.productUrl as string) ||
      (candidate.url as string) ||
      (candidate.link as string) ||
      null,
    link: ((candidate.link as string) || (candidate.productUrl as string) || null) as string | null,
    price: toNumber(candidate.price, 0) || null,
    currency: (candidate.currency as string) || (candidate.currencyCode as string) || "",
    image:
      (candidate.image as string) ||
      (candidate.imageUrl as string) ||
      (candidate.thumbnailUrl as string) ||
      (candidate.generatedImageUrl as string) ||
      null,
    category: (candidate.category as string) || (candidate.productType as string) || null,
    brand: (candidate.brand as string) || null,
    source: (candidate.source as string) || null,
    trendingScore: toNumber(candidate.trendingScore, 0),
    likeCount: toNumber(candidate.likeCount ?? candidate.likes, 0),
    viewCount: toNumber(candidate.viewCount ?? candidate.views, 0),
    tryOnUrl:
      (candidate.tryOnUrl as string) ||
      (candidate.publicUrl as string) ||
      (candidate.resultUrl as string) ||
      null,
    createdAt: (candidate.createdAt as string) || undefined,
    updatedAt: (candidate.updatedAt as string) || undefined,
  };
}

function pickResults(payload: unknown): unknown[] {
  const source = (payload || {}) as Record<string, unknown>;
  if (Array.isArray(source.results)) return source.results;
  if (Array.isArray(source.data)) return source.data;

  const data = source.data as Record<string, unknown> | undefined;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.products)) return data.products;

  return [];
}

export default function StyleDiscoveryPage() {
  const router = useRouter();
  const { selectedAesthetic, setSelectedAesthetic } = useStyleDiscovery();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [discoverProducts, setDiscoverProducts] = useState<FeedProduct[]>([]);
  const [discoverPage, setDiscoverPage] = useState(0);
  const [hasMoreDiscover, setHasMoreDiscover] = useState(true);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<FeedProduct[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [trendingTryons, setTrendingTryons] = useState<FeedProduct[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});
  const discoverLoaderRef = useRef<HTMLDivElement | null>(null);

  const allVisibleProducts = useMemo(
    () => [...discoverProducts, ...recommendations, ...trendingTryons],
    [discoverProducts, recommendations, trendingTryons],
  );

  const seedProductCounts = useCallback((products: FeedProduct[]) => {
    setLikeCounts((previous) => {
      const next = { ...previous };
      for (const product of products) {
        const productId = product.id;
        if (!productId) continue;
        if (typeof next[productId] === "undefined") {
          next[productId] = product.likeCount || 0;
        }
      }
      return next;
    });

    setViewCounts((previous) => {
      const next = { ...previous };
      for (const product of products) {
        const productId = product.id;
        if (!productId) continue;
        if (typeof next[productId] === "undefined") {
          next[productId] = product.viewCount || 0;
        }
      }
      return next;
    });
  }, []);

  const updateProductMetric = useCallback(async (productId: string, action: "VIEW" | "LIKE" | "CLICK") => {
    const endpoint = `/api/search/product-metric/${productId}`;
    const body = JSON.stringify({ action });

    let response = await authFetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.status === 404 || response.status === 405) {
      response = await authFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
    }

    return response.ok;
  }, []);

  const handleLike = useCallback(
    async (product: FeedProduct) => {
      if (!product.id) return;
      setLikeCounts((previous) => ({ ...previous, [product.id!]: (previous[product.id!] || 0) + 1 }));
      void updateProductMetric(product.id, "LIKE");
    },
    [updateProductMetric],
  );

  const handleViewed = useCallback(
    async (product: FeedProduct) => {
      if (!product.id) return;
      setViewCounts((previous) => ({ ...previous, [product.id!]: (previous[product.id!] || 0) + 1 }));
      void updateProductMetric(product.id, "VIEW");
    },
    [updateProductMetric],
  );

  const toggleFavourite = useCallback((product: FeedProduct) => {
    if (!product.id) return;
    setFavourites((previous) => ({ ...previous, [product.id!]: !previous[product.id!] }));
  }, []);

  const upsertPreferences = async (styleTags: string[]) => {
    const payload = {
      age: 25,
      ethnicity: "unspecified",
      gender: "unspecified",
      location: "",
      preferredColors: [],
      styleTags,
      notificationPrefs: true,
    };

    const profileResponse = await authFetch("/api/profile/profile", {
      method: "GET",
    });
    const method = profileResponse.ok ? "PUT" : "POST";

    await authFetch("/api/profile/preferences", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  };

  const handleGenerateRecommendations = async () => {
    setError(null);

    const styleTags = selectedAesthetic ? [selectedAesthetic] : [];
    const finalPrompt = [prompt.trim(), selectedAesthetic ? `Style: ${selectedAesthetic}` : ""]
      .filter(Boolean)
      .join(" | ");

    if (!finalPrompt) {
      setError("Add a prompt or select a style aesthetic.");
      return;
    }

    setIsGenerating(true);

    try {
      try {
        await upsertPreferences(styleTags);
      } catch {
        // Continue recommendation generation for guest users even if profile update fails.
      }

      const searchResponse = await authFetch("/api/search/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput: finalPrompt }),
      });

      const payload = (await searchResponse.json().catch(() => ({}))) as SearchResponse;

      if (!searchResponse.ok) {
        throw new Error(payload.message || "Failed to generate recommendations");
      }

      localStorage.setItem(STYLE_DISCOVERY_PROMPT_STORAGE_KEY, prompt);
      localStorage.setItem(STYLE_DISCOVERY_AESTHETIC_STORAGE_KEY, selectedAesthetic || "");
      localStorage.setItem(
        SEARCH_RECOMMENDATIONS_STORAGE_KEY,
        JSON.stringify(payload.results || []),
      );

      router.push("/styling-session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsRecommendationsLoading(true);

      try {
        const response = await authFetch("/api/recommendations?limit=10&skip=0", {
          method: "GET",
        });

        if (response.status === 401 || response.status === 403) {
          setIsAuthenticated(false);
          setShowRecommendations(false);
          setRecommendations([]);
          return;
        }

        setIsAuthenticated(true);

        if (!response.ok) {
          throw new Error("Failed to load recommendations");
        }

        const payload = (await response.json().catch(() => ({}))) as SearchResponse;
        const normalized = pickResults(payload).map((item, index) => normalizeFeedProduct(item, index));

        setRecommendations(normalized.slice(0, 10));
        setShowRecommendations(normalized.length > 0);
        seedProductCounts(normalized);
      } catch {
        setIsAuthenticated(false);
        setShowRecommendations(false);
        setRecommendations([]);
      } finally {
        setIsRecommendationsLoading(false);
      }
    };

    void fetchRecommendations();
  }, [seedProductCounts]);

  useEffect(() => {
    if (!hasMoreDiscover) return;

    const fetchDiscoverProducts = async () => {
      setIsDiscoverLoading(true);
      setDiscoverError(null);

      try {
        const skip = discoverPage * DISCOVER_PAGE_SIZE;
        const response = await authFetch(
          `/api/products/discover?limit=${DISCOVER_PAGE_SIZE}&skip=${skip}`,
          {
            method: "GET",
          },
        );

        const payload = (await response.json().catch(() => ({}))) as SearchResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load discover products");
        }

        const nextPageProducts = pickResults(payload).map((item, index) =>
          normalizeFeedProduct(item, skip + index),
        );

        setDiscoverProducts((previous) => {
          const seen = new Set(previous.map((product) => product.id));
          const incoming = nextPageProducts.filter((product) => {
            if (!product.id) return true;
            if (seen.has(product.id)) return false;
            seen.add(product.id);
            return true;
          });
          return [...previous, ...incoming];
        });

        seedProductCounts(nextPageProducts);
        setHasMoreDiscover(nextPageProducts.length === DISCOVER_PAGE_SIZE);
      } catch (err) {
        setDiscoverError(err instanceof Error ? err.message : "Failed to load discover products");
        // Stop infinite-scroll retries after a hard fetch failure.
        setHasMoreDiscover(false);
      } finally {
        setIsDiscoverLoading(false);
      }
    };

    void fetchDiscoverProducts();
  }, [discoverPage, hasMoreDiscover, seedProductCounts]);

  useEffect(() => {
    const target = discoverLoaderRef.current;
    if (!target || isDiscoverLoading || !hasMoreDiscover) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setDiscoverPage((previous) => previous + 1);
      },
      { rootMargin: "300px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreDiscover, isDiscoverLoading]);

  useEffect(() => {
    if (isAuthenticated !== true) {
      setTrendingTryons([]);
      return;
    }

    const fetchTrendingTryons = async () => {
      setIsTrendingLoading(true);
      setTrendingError(null);

      try {
        const response = await authFetch("/api/tryon/trending?limit=10&skip=0", {
          method: "GET",
        });

        const payload = (await response.json().catch(() => ({}))) as SearchResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load trending try-on results");
        }

        const normalized = pickResults(payload).map((item, index) => normalizeFeedProduct(item, index));
        setTrendingTryons(normalized);
        seedProductCounts(normalized);
      } catch (err) {
        setTrendingError(
          err instanceof Error ? err.message : "Failed to load trending try-on results",
        );
      } finally {
        setIsTrendingLoading(false);
      }
    };

    void fetchTrendingTryons();
  }, [isAuthenticated, seedProductCounts]);

  useEffect(() => {
    seedProductCounts(allVisibleProducts);
  }, [allVisibleProducts, seedProductCounts]);

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <StyleDiscoveryHero />

      <StyleDiscoveryContent
        selectedAesthetic={selectedAesthetic}
        setSelectedAesthetic={setSelectedAesthetic}
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerateRecommendations={handleGenerateRecommendations}
        isGenerating={isGenerating}
        error={error}
      />

      <TrendingTryonsSection
        show={Boolean(isAuthenticated)}
        isLoading={isTrendingLoading}
        error={trendingError}
        items={trendingTryons}
        likeCounts={likeCounts}
        viewCounts={viewCounts}
        favourites={favourites}
        onViewed={handleViewed}
        onLike={handleLike}
        onFavoriteToggle={toggleFavourite}
      />

      <RecommendationSection
        show={showRecommendations || isRecommendationsLoading}
        isLoading={isRecommendationsLoading}
        items={recommendations}
        likeCounts={likeCounts}
        viewCounts={viewCounts}
        favourites={favourites}
        onViewed={handleViewed}
        onLike={handleLike}
        onFavoriteToggle={toggleFavourite}
      />

      <DiscoverFeedSection
        items={discoverProducts}
        isLoading={isDiscoverLoading}
        error={discoverError}
        hasMore={hasMoreDiscover}
        loaderRef={discoverLoaderRef}
        likeCounts={likeCounts}
        viewCounts={viewCounts}
        favourites={favourites}
        onViewed={handleViewed}
        onLike={handleLike}
        onFavoriteToggle={toggleFavourite}
      />

      <StyleDiscoveryInspirationGrid />
    </main>
  );
}
// End of file