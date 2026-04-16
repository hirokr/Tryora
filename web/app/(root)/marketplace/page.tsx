"use client";

import { SEARCH_RECOMMENDATIONS_STORAGE_KEY } from "@/constants/flow";
import type { SearchProduct } from "@/types/search";
import { useEffect, useMemo, useState } from "react";

import { MarketplaceHero } from "./_components/MarketplaceHero";
import { MarketplaceToast } from "./_components/MarketplaceToast";
import { MarketplaceTopBar } from "./_components/MarketplaceTopBar";
import { ProductGrid } from "./_components/ProductGrid";
import type { FilterType, Product } from "../../../types/producttypes";

const ACCESSORIES_CATEGORIES = new Set(["Footwear", "Jewelry", "Artisan"]);

type ProductApiResponse = {
  status?: string;
  message?: string;
  data?: {
    id?: string;
    name?: string;
    category?: string;
    price?: number | null;
    imageUrl?: string | null;
    images?: Array<{ url?: string | null }>;
    colorTags?: string[];
    patternTags?: string[];
  };
};

const PLACEHOLDER_IMAGE = "/Styling%20secession/styling%20secession%201.png";

const formatPrice = (value?: number | null) =>
  typeof value === "number" ? `BDT ${value.toLocaleString()}` : "Price unavailable";

const mapApiProductToCard = (payload: ProductApiResponse["data"]): Product | null => {
  if (!payload?.id) {
    return null;
  }

  const primaryImage =
    payload.imageUrl || payload.images?.find((image) => Boolean(image?.url))?.url || PLACEHOLDER_IMAGE;
  const name = payload.name || "Unnamed product";

  return {
    id: payload.id,
    name,
    price: formatPrice(payload.price),
    category: payload.category || "Uncategorized",
    img: primaryImage,
    alt: `${name} image`,
  };
};

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [toastVisible, setToastVisible] = useState(true);
  const [productIdsInput, setProductIdsInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [colorTagsInput, setColorTagsInput] = useState("");
  const [patternTagsInput, setPatternTagsInput] = useState("");
  const [aiColor, setAiColor] = useState("");
  const [aiPattern, setAiPattern] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedRecommendations = localStorage.getItem(SEARCH_RECOMMENDATIONS_STORAGE_KEY);
    if (!savedRecommendations) {
      return;
    }

    try {
      const parsed = JSON.parse(savedRecommendations) as SearchProduct[];
      const ids = Array.from(
        new Set(parsed.map((item) => item.id).filter((id): id is string => Boolean(id))),
      );

      if (ids.length > 0) {
        setProductIdsInput(ids.join(", "));
        void loadProductsByIds(ids);
      }
    } catch {
      // Ignore invalid storage payload and let users load IDs manually.
    }
  }, []);

  const loadProductsByIds = async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([]);
      setSelectedProductId("");
      return;
    }

    setIsLoadingProducts(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const responses = await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`/api/products/${id}`, {
            method: "GET",
          });

          const payload = (await response.json().catch(() => ({}))) as ProductApiResponse;

          if (!response.ok) {
            return null;
          }

          return mapApiProductToCard(payload.data);
        }),
      );

      const nextProducts = responses.filter((product): product is Product => Boolean(product));

      setProducts(nextProducts);
      setSelectedProductId((current) =>
        current && nextProducts.some((product) => String(product.id) === current)
          ? current
          : (nextProducts[0] ? String(nextProducts[0].id) : ""),
      );

      if (nextProducts.length === 0) {
        setError("No products were returned for the provided product IDs.");
      }
    } catch {
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleLoadProducts = async () => {
    const ids = Array.from(
      new Set(
        productIdsInput
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );

    await loadProductsByIds(ids);
  };

  const handleUpdateAppearance = async () => {
    if (!selectedProductId) {
      setError("Select a product first.");
      return;
    }

    setIsSavingAppearance(true);
    setError(null);
    setSuccessMessage(null);

    const colorTags = colorTagsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const patternTags = patternTagsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/products/${selectedProductId}/appearance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ colorTags, patternTags }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        setError(payload.message || "Failed to update product appearance.");
        return;
      }

      setSuccessMessage("Product appearance updated.");
      await handleLoadProducts();
    } catch {
      setError("Failed to update product appearance.");
    } finally {
      setIsSavingAppearance(false);
    }
  };

  const handleAiEdit = async () => {
    if (!selectedProductId) {
      setError("Select a product first.");
      return;
    }

    if (!aiColor.trim()) {
      setError("Provide a color for AI edit.");
      return;
    }

    setIsGeneratingEdit(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/products/${selectedProductId}/appearance/ai-edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          color: aiColor.trim(),
          pattern: aiPattern.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        setError(payload.message || "Failed to generate AI edited image.");
        return;
      }

      setSuccessMessage("AI edited product image generated.");
      await handleLoadProducts();
    } catch {
      setError("Failed to generate AI edited image.");
    } finally {
      setIsGeneratingEdit(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === "All") {
      return products;
    }

    if (activeFilter === "Accessories") {
      return products.filter((product) => ACCESSORIES_CATEGORIES.has(product.category));
    }

    return products.filter((product) => !ACCESSORIES_CATEGORIES.has(product.category));
  }, [activeFilter, products]);

  return (
      <main className="flex min-h-screen flex-col overflow-hidden bg-background-light pt-24 dark:bg-background-dark">
        <MarketplaceTopBar />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto">
            <MarketplaceHero activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            <section className="mb-8 rounded-xl border border-primary/20 bg-white/70 p-4 dark:bg-primary/5">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Load products by ID
              </p>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={productIdsInput}
                  onChange={(event) => setProductIdsInput(event.target.value)}
                  placeholder="Enter comma-separated product IDs"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => void handleLoadProducts()}
                  disabled={isLoadingProducts}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isLoadingProducts ? "Loading..." : "Load"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select product for edits</option>
                  {products.map((product) => (
                    <option key={String(product.id)} value={String(product.id)}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <input
                  value={colorTagsInput}
                  onChange={(event) => setColorTagsInput(event.target.value)}
                  placeholder="color tags: black, beige"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  value={patternTagsInput}
                  onChange={(event) => setPatternTagsInput(event.target.value)}
                  placeholder="pattern tags: striped, floral"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => void handleUpdateAppearance()}
                  disabled={isSavingAppearance}
                  className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
                >
                  {isSavingAppearance
                    ? "Updating..."
                    : "Update appearance"}
                </button>
                <input
                  value={aiColor}
                  onChange={(event) => setAiColor(event.target.value)}
                  placeholder="ai color"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  value={aiPattern}
                  onChange={(event) => setAiPattern(event.target.value)}
                  placeholder="ai pattern (optional)"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => void handleAiEdit()}
                  disabled={isGeneratingEdit}
                  className="rounded-lg border border-primary/30 bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isGeneratingEdit
                    ? "Generating..."
                    : "Generate AI edit"}
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              {successMessage && <p className="mt-3 text-sm text-emerald-500">{successMessage}</p>}
            </section>

            <ProductGrid products={filteredProducts} />
          </div>

          {toastVisible && <MarketplaceToast onClose={() => setToastVisible(false)} />}
        </div>
      </main>
  );
}
