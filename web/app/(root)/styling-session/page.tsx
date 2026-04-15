"use client";

import { useEffect, useState } from "react";

import {
  StylingAvatarPanel,
  StylingEventPanel,
  StylingRecommendationsPanel,
} from "@/components/utility/experience/StylingSessionWorkspace";
import {
  AVATAR_UPLOADS_STORAGE_KEY,
  SEARCH_RECOMMENDATIONS_STORAGE_KEY,
  STYLE_DISCOVERY_AESTHETIC_STORAGE_KEY,
  STYLE_DISCOVERY_PROMPT_STORAGE_KEY,
  TRYON_RESULT_STORAGE_KEY,
  TRYON_RESULT_STORAGE_KEY_ALT,
  TRYON_RESULT_STORAGE_KEY_AVATAR,
} from "@/constants/flow";

import {
  STYLING_AVATAR_BY_CATEGORY,
  STYLING_PRODUCTS,
} from "@/constants/experience";
import type { StylingCategory, StylingProduct } from "@/types/experience";
import type { SearchProduct, SearchResponse } from "@/types/search";

type TryOnResponse = {
  message?: string;
  bodyImageId?: string;
  imageUrl?: string;
  images?: Array<{
    tryonResultId?: string;
    productId?: string;
    imageUrl?: string;
  }>;
};

type SearchHistoryResponse = {
  message?: string;
  results?: Array<{ id: string }>;
};

type ProductDetailResponse = {
  message?: string;
  data?: SearchProduct;
};

const FILTER_CHIPS = ["Recommended", "Trending", "History", "Query"] as const;
type FilterChip = (typeof FILTER_CHIPS)[number];

const mapSearchProductToStylingProduct = (product: SearchProduct) => ({
  id: product.id,
  name: product.title,
  sub: product.brand || product.category || "Recommended",
  price: product.price ? `${product.price} ${product.currency || ""}`.trim() : "Price unavailable",
  img: product.image || "/Styling%20secession/styling%20secession%201.png",
  source: product.source || undefined,
  currency: product.currency || undefined,
  priceValue: product.price || undefined,
  productUrl: product.productUrl || product.link || undefined,
});

export default function StylingSessionPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("Recommended");
  const [savedAesthetic, setSavedAesthetic] = useState<StylingCategory>("Avant-Garde");
  const [prompt, setPrompt] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [generatedTryOnImageUrl, setGeneratedTryOnImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [dynamicProducts, setDynamicProducts] = useState<StylingProduct[]>([]);
  const [selectedProductDetail, setSelectedProductDetail] = useState<SearchProduct | null>(null);

  useEffect(() => {
    const savedPrompt = localStorage.getItem(STYLE_DISCOVERY_PROMPT_STORAGE_KEY) || "";
    const savedAesthetic = localStorage.getItem(STYLE_DISCOVERY_AESTHETIC_STORAGE_KEY) as StylingCategory | "";
    const savedUploads = localStorage.getItem(AVATAR_UPLOADS_STORAGE_KEY);
    const savedRecommendations = localStorage.getItem(SEARCH_RECOMMENDATIONS_STORAGE_KEY);

    setPrompt(savedPrompt);

    if (savedAesthetic && Object.keys(STYLING_AVATAR_BY_CATEGORY).includes(savedAesthetic)) {
      setSavedAesthetic(savedAesthetic as StylingCategory);
    }

    if (savedUploads) {
      try {
        const parsed = JSON.parse(savedUploads) as {
          front?: { url?: string };
        };
        if (parsed.front?.url) {
          setFrontImageUrl(parsed.front.url);
        }
      } catch {
        // Ignore malformed local state.
      }
    }

    if (savedRecommendations) {
      try {
        const parsed = JSON.parse(savedRecommendations) as SearchProduct[];
        setDynamicProducts(parsed.map(mapSearchProductToStylingProduct));
      } catch {
        // Ignore malformed recommendation state.
      }
    }
  }, []);

  const products =
    dynamicProducts.length > 0
      ? dynamicProducts
      : STYLING_PRODUCTS[savedAesthetic] || STYLING_PRODUCTS["Avant-Garde"];
  const avatarSrc = frontImageUrl || STYLING_AVATAR_BY_CATEGORY[savedAesthetic];

  const fetchRecommendedProducts = () => {
    const savedRecommendations = localStorage.getItem(SEARCH_RECOMMENDATIONS_STORAGE_KEY);
    if (!savedRecommendations) {
      setDynamicProducts([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedRecommendations) as SearchProduct[];
      setDynamicProducts(parsed.map(mapSearchProductToStylingProduct));
    } catch {
      setDynamicProducts([]);
    }
  };

  const fetchTrendingProducts = async () => {
    const response = await fetch("/api/search/trending?limit=24&skip=0", { method: "GET" });
    const payload = (await response.json().catch(() => ({}))) as SearchResponse;

    if (!response.ok) {
      throw new Error(payload.message || "Failed to fetch trending products");
    }

    setDynamicProducts((payload.results || []).map(mapSearchProductToStylingProduct));
  };

  const fetchHistoryProducts = async () => {
    const historyResponse = await fetch("/api/search/history", { method: "GET" });
    const historyPayload = (await historyResponse.json().catch(() => ({}))) as SearchHistoryResponse;

    if (!historyResponse.ok) {
      throw new Error(historyPayload.message || "Failed to fetch search history");
    }

    const latestSearchId = historyPayload.results?.[0]?.id;
    if (!latestSearchId) {
      setDynamicProducts([]);
      return;
    }

    const productsResponse = await fetch(`/api/search/${latestSearchId}/products`, {
      method: "GET",
    });
    const productsPayload = (await productsResponse.json().catch(() => ({}))) as SearchResponse;

    if (!productsResponse.ok) {
      throw new Error(productsPayload.message || "Failed to fetch history products");
    }

    setDynamicProducts((productsPayload.results || []).map(mapSearchProductToStylingProduct));
  };

  const fetchProductsByQuery = async () => {
    const filterQuery: Record<string, string> = {};

    if (prompt.trim()) {
      filterQuery.title = prompt.trim();
    }

    if (savedAesthetic) {
      filterQuery.category = savedAesthetic;
    }

    if (Object.keys(filterQuery).length === 0) {
      throw new Error("Add prompt or style to run query filter.");
    }

    const response = await fetch("/api/search/search-by-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filterQuery }),
    });

    const payload = (await response.json().catch(() => ({}))) as SearchResponse;

    if (!response.ok) {
      throw new Error(payload.message || "Failed to fetch query-based products");
    }

    setDynamicProducts((payload.results || []).map(mapSearchProductToStylingProduct));
  };

  const handleFilterChange = async (nextFilter: string) => {
    const safeFilter = nextFilter as FilterChip;
    setActiveFilter(safeFilter);
    setProductsError(null);
    setSelectedProductIds([]);
    setSelectedProductDetail(null);

    setIsLoadingProducts(true);
    try {
      if (safeFilter === "Recommended") {
        fetchRecommendedProducts();
      } else if (safeFilter === "Trending") {
        await fetchTrendingProducts();
      } else if (safeFilter === "History") {
        await fetchHistoryProducts();
      } else if (safeFilter === "Query") {
        await fetchProductsByQuery();
      }
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Failed to load products");
      setDynamicProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const viewProductDetails = async (productId: string) => {
    setProductsError(null);

    try {
      const response = await fetch(`/api/search/product/${productId}`, {
        method: "GET",
      });
      const payload = (await response.json().catch(() => ({}))) as ProductDetailResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Failed to fetch product details");
      }

      setSelectedProductDetail(payload.data || null);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Failed to fetch product details");
    }
  };

  const generateTryOn = async () => {
    if (selectedProductIds.length === 0) {
      setGenerateError("Select at least one product to generate a try-on image.");
      return;
    }

    if (!frontImageUrl) {
      setGenerateError("Front body image is required. Please upload in Update Pics first.");
      return;
    }

    setGenerateError(null);
    setIsGenerating(true);

    try {
      const selectedProducts = products.filter(
        (product) => product.id && selectedProductIds.includes(product.id),
      );

      const response = await fetch("/api/images/try-on", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProductIds,
          productIdeas: selectedProducts.map((product) => product.name),
          poseImageUrl: frontImageUrl,
          poser: "front",
          category: "tops",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as TryOnResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Failed to generate try-on image");
      }

      const generatedImage = payload.imageUrl || payload.images?.[0]?.imageUrl;
      const tryonResultId = payload.images?.[0]?.tryonResultId;

      if (!generatedImage) {
        throw new Error("Try-on image was not returned by the API.");
      }

      if (tryonResultId) {
        localStorage.setItem(TRYON_RESULT_STORAGE_KEY, tryonResultId);
        localStorage.setItem(TRYON_RESULT_STORAGE_KEY_ALT, tryonResultId);
        localStorage.setItem(TRYON_RESULT_STORAGE_KEY_AVATAR, tryonResultId);
      }

      setGeneratedTryOnImageUrl(generatedImage);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate try-on image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <StylingEventPanel prompt={prompt} onPromptChange={setPrompt} />
      <StylingAvatarPanel
        avatarSrc={avatarSrc}
        showHotspots={savedAesthetic === "Avant-Garde" && !generatedTryOnImageUrl}
        generatedTryOnImageUrl={generatedTryOnImageUrl}
      />
      <StylingRecommendationsPanel
        products={products}
        categories={[...FILTER_CHIPS]}
        activeCategory={activeFilter}
        onSelectCategory={(value) => {
          void handleFilterChange(value);
        }}
        selectedProductIds={selectedProductIds}
        onToggleProduct={toggleProduct}
        onViewDetails={viewProductDetails}
        onGenerateTryOn={generateTryOn}
        isGenerating={isGenerating}
        isLoadingProducts={isLoadingProducts}
        productsError={productsError}
        generateError={generateError}
      />
      {selectedProductDetail ? (
        <section className="rounded-2xl border border-primary/20 bg-background-dark p-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Product Details</p>
          <h3 className="mt-2 text-lg font-bold">{selectedProductDetail.title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {selectedProductDetail.brand || "Unknown brand"} · {selectedProductDetail.category || "Uncategorized"}
          </p>
          <p className="mt-2 text-sm text-primary">
            {selectedProductDetail.price
              ? `${selectedProductDetail.price} ${selectedProductDetail.currency || ""}`.trim()
              : "Price unavailable"}
          </p>
        </section>
      ) : null}
    </main>
  );
}
